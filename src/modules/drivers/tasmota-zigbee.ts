import { createLog } from "advance-log";
import { DriverControl, DriverHook, DriverPacket } from "../../interface/device-service.interface";
import { Device, DeviceBasic, ValuesBasic, deviceValueDefault } from "../../interface/device.interface";
import { LocalDatabaseQuery } from "local-database-lite";
import { getParams, toArray } from "ultility-tools";

const _TYPE="tasmota-zigbee"
const log=createLog(_TYPE)
const _NETWORK_IDs=["mqtt"]

const services:DriverHook[]=[
    {
        //{"ZbData":"ZbData 0x2F4B,0AB6BB266551FFFFFFFFFF"}
        id:'update',
        name:'maping short address & address',
        ref:'stat/:eid/RESUL',
        handler(client, packet, infor, driverService, network) {
            const payload=JSON.parse(packet.payload);
            const zbData:string=payload['ZbData'];
            if(!zbData) return;
            const addrs=zbData.split(" ")[1].split(",");
            const device:DeviceBasic={id:addrs[1],address:addrs[0]}
            log("zigbee update ",device);
            driverService.onUpdate([device]);
        },
    },
    {
        //{"ZbReceived":{"0x1067":{"Device":"0x1067",
        //"Temperature":19.04,"Humidity":70.89,"Endpoint":1,"LinkQuality":141}}}
        id:'update',
        name:'maping short address & address',
        ref:'tele/:eid/SENSOR',
        handler(client, packet, infor, driverService, network) {
            const eid:string=getParams(packet.topic,infor.ref)['eid'];
            const datas=getZbReceived(packet.payload,eid);
            log("ZbReceived ",datas);
            datas.forEach(data=>{
                driverService.onUpdateBySearch(data.device,data.condition)
            })
            
        },
    },
    {
        //{"ZbParent":{"Device":"0x0000","Children":1,"ChildInfo":["0x00124B0023B46876"]}}
        id:'update',
        name:'login for sensor',
        ref:'tele/:eid/RESULT',
        handler(client, packet, infor, driverService, network) {
            const payload=JSON.parse(packet.payload)
            const ZbParent=payload.ZbParent
            if(!ZbParent) return;
            const ChildInfo:string[]=ZbParent.ChildInfo;
            if(!ChildInfo) return;
            const eid:string=getParams(packet.topic,infor.ref)['eid']
            const devices:DeviceBasic[]=ChildInfo.map(id=>{
                const device:DeviceBasic={id,eid,values:[{id:'online',value:1}]}
                return device
            })
            log("ZbParent ",devices);
            driverService.onUpdate(devices);
        },
    },
    /**
     * tele/E8DB849DBFAE/SENSOR = 
     * payload={
     *      "ZbInfo":{
     *          "0x1067":{
     *              "Device":"0x1067",
     *              "IEEEAddr":"0x00124B0023B46876",
     *              "ModelId":"TH01",
     *              "Manufacturer":"eWeLink",
     *              "Endpoints":[1],
     *              "Config":["T01"],
     *              "Temperature":19.58,
     *              "Humidity":73.3,
     *              "Reachable":false,
     *              "BatteryPercentage":46,
     *              "BatteryLastSeenEpoch":1706318633,
     *              "LastSeen":8189,
     *              "LastSeenEpoch":1706318633,
     *              "LinkQuality":136
     *          }
     *      }
     * }
     */
    {
        // test
        id:'update',
        name:'update sensor infor',
        ref:'tele/:eid/SENSOR',
        handler(client, packet, infor, driverService, network) {
            const payload=JSON.parse(packet.payload);
            const zbInfor=payload['ZbInfo'];
            if(!zbInfor) return ;//not case =>Ignore
            const infGuides:GuideData[]=[{k:'Device',n:'address'},{k:'ModelId',n:'model'}]
            const valueGuides:GuideData[]=[
                {k:'Temperature',n:'id',fn:(val:string)=>parseFloat(val)},
                {k:'Humidity',n:'id',fn:(val:string)=>parseFloat(val)},
                {k:'BatteryPercentage',n:'id',fn:(val:string)=>parseFloat(val)}
            ];
            const devices:DeviceBasic[]=Object.keys(zbInfor).map(key=>{
                const obj=(zbInfor as any)[key]
                const inf=extractObject(obj,infGuides);
                const valueInf=extractObject(obj,valueGuides);
                const values:ValuesBasic[]=Object.keys(valueInf).map(key=>Object.assign({},valueInf[key]))
                const device:DeviceBasic={...inf,values}
                return device
            })
            log('ZbInfo ',devices);
            
        },
    },
    {
        // test
        id:'test',
        name:'testing',
        ref:'tasmota/discovery/:eid/sensors',
        handler(client, packet, infor, driverService, network) {
            log("test payload: ",packet.payload)
            
        },
    }
]

const control:DriverControl={

}

////////////////// MAIN FUNCTION //////////////
export default function startup():DriverPacket{
    return {services,networkIds:_NETWORK_IDs,control,type:_TYPE}
}

//////// MINI FUNCTIONS //////////////////////

/** get zbReceived
 payload ={"ZbReceived":{"0x1067":{"Device":"0x1067",
 "Temperature":19.04,"Humidity":70.89,"Endpoint":1,"LinkQuality":141}}}
 */
function getZbReceived(payload:string,eid:string){
    const devices:{device:{values:ValuesBasic[]},condition:Partial<Device|DeviceBasic>}[]=[]
    try{
        const obj=JSON.parse(payload);
        const zbReceived=obj['ZbReceived'];
        if(!zbReceived) throw new Error("other type");
        const list=[{k:'Temperature',n:'temp'},{k:'Humidity',n:'humi'},{k:'LinkQuality',n:'network'}]
        Object.keys(zbReceived).forEach(dv=>{
            const data=zbReceived[dv];
            if(!data) return;
            const values:ValuesBasic[]=[]
            Object.keys(data).forEach(item=>{
                if(item.toLowerCase()==='device') return;
                const lst=list.find(x=>x.k===item);
                if(!lst) return log("dont care this item %s",item);
                const value=parseFloat(data[item])
                values.push({id:lst.n,value})
            })
            const device={values};
            const condition:Partial<Device>={eid,address:dv}
            devices.push({device,condition})
        })
        return devices;
    }
    catch(err){
        const msg=err instanceof Error?err.message:"other"
        log("## ERROR: ",msg);
        return devices;
    }
}

/** extract information from object */
function extractObject(obj:object,guides:GuideData|GuideData[]){
    const _guides:GuideData[]=toArray(guides);
    const out:any={}
    Object.keys(obj).forEach(key=>{
        const guide=_guides.find(g=>g.k===key);
        if(!guide) return ;// except list => Ignore
        let val=(obj as any)[key];
        if(guide.fn && typeof guide.fn==='function') val=guide.fn(val,guide)
        out[guide.n]=val;
    })
    return out;
}

interface GuideData{
    k:string;       // key for search
    n:string;       // name
    fn?:(value:any,inf:GuideData)=>any;
}