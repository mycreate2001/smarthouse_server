import { createLog } from "advance-log";
import { DriverControl, DriverHook, DriverHookDb, DriverPacket } from "../../interface/device-service.interface";
import { CommonDriverService, Device, DeviceBasic, DeviceRemote, ValuesBasic } from "../../interface/device.interface";
import { getParams, toArray } from "ultility-tools";
import { CommonClient, Packet, CommonNetwork } from "../../interface/network.interface";

const _TYPE="tasmota-zigbee"
const log=createLog(_TYPE)
const _NETWORK_IDs=["mqtt"]
const _FB_TOPIC="_fb"
const dvKeys:GuideData[]=[
    {k:'Device',n:'address'},
    {k:'ModelId',n:'model'},
    {k:"IEEEAddr",n:"id"}
]
const vlKeys:GuideData[]=[
    {k:'Temperature',n:'temp'},
    {k:'Humidity',n:'humi'},
    {k:'LinkQuality',n:'network'},
    {k:'Contact',n:'contact'},
    {k:'BatteryPercentage',n:'batt'},
    {k:'Dimmer',n:'dimmer'}
]

const services:DriverHookDb={
    connectOffline:{
        type: "connect",
        ref: "tele/:eid/LWT",
        handler: function (client: CommonClient, packet: Packet, infor: DriverHook, driverService: CommonDriverService, network: CommonNetwork) {
            log("%d payload %s",infor.id,packet.payload.substring(0,100))
            const eid:string=getParams(packet.topic,infor.ref)['eid'];
            const payload=packet.payload;
            const value:number=payload.toUpperCase()=='ONLINE'?1:0
            if(value) return ;// online may be zigbee not yet online => dont care
            const device:Partial<DeviceBasic>={
                values: [{ id: 'online', value }],
            }
            const obj:Partial<Device>={eid,type:_TYPE}
            log("%d result $s",infor.id,JSON.stringify({device,obj}));
            driverService.onUpdateBySearch(device,obj,infor.id)
        }
    },
    /** Not correctly */
    // zbdata: {
    //     //topic: stat/E8DB849DBFAE/RESULT,stat/E8DB849DBFAE/RESULT
    //     // payload: {"ZbData":"ZbData 0x2F4B,0AB6BB266551FFFFFFFFFF"}
    //     // payload2:{"ZbData":"Done"} =>reject
    //     type:'update',
    //     name:'maping short address & address',
    //     ref:'stat/:eid/RESULT',
    //     handler(client, packet, infor, driverService, network) {
    //         log("%d %s",packet.payload.substring(0,100))
    //         const eid:string=getParams(packet.topic,infor.ref)['eid']
    //         const payload=JSON.parse(packet.payload);
    //         const zbData:string=payload['ZbData'];
    //         if(!zbData) return;
    //         const _a=zbData.split(" ")
    //         if(_a.length!==2) return;
    //         const addrs=_a[1].split(",");
    //         if(addrs.length!==2) return;
    //         const device:DeviceBasic={id:addrs[1],address:addrs[0],eid,type:_TYPE}
    //         // log("%d ",device);
    //         driverService.onUpdate([device]);
    //     },
    // },
    ZbReceived: {
        //{"ZbReceived":{"0x1067":{"Device":"0x1067",
        //"Temperature":19.04,"Humidity":70.89,"Endpoint":1,"LinkQuality":141}}}
        //payload:{"ZbReceived":{"0x1FAB":{"Device":"0x1FAB","0500?00":"010000010000","ZoneStatusChange":1,"ZoneStatusChangeZone":1,"Contact":1,"Endpoint":1,"LinkQuality":131}}}
        type:'update',
        name:'maping short address & address',
        ref:'tele/:eid/SENSOR',
        handler(client, packet, infor, driverService, network) {
            log("%d payload %s",infor.id,packet.payload.substring(0,100))
            const eid:string=getParams(packet.topic,infor.ref)['eid'];
            const payload=JSON.parse(packet.payload);
            const ZbReceived=payload.ZbReceived;
            if(!ZbReceived||typeof ZbReceived!=='object') return;
            Object.keys(ZbReceived).forEach(key=>{
                const obj=ZbReceived[key]
                let {values,...other}=getZbInfor(obj);
                values=[...values,{id:'online',value:1}]
                const device:Partial<DeviceBasic>={...other,eid,type:_TYPE,values}
                const search:Partial<DeviceBasic>={address:device.address,eid,type:_TYPE}
                log("%d result %s",infor.id,JSON.stringify({device,search}))
                driverService.onUpdateBySearch(device,search,infor.id);
            })
            
        },
    },
    ZbParent: {
        // update zigbe device online
        // payload:{"ZbParent":{"Device":"0x0000","Children":1,"ChildInfo":["0x00124B0023B46876"]}}
        type:'update',
        name:'online for zigbee devices',
        ref:'tele/:eid/RESULT',
        handler(client, packet, infor, driverService, network) {
            log("%d payload %s",infor.id,packet.payload.substring(0,100))
            const payload=JSON.parse(packet.payload)
            const ZbParent=payload.ZbParent
            if(!ZbParent) return;
            const ChildInfo:string[]=ZbParent.ChildInfo;
            if(!ChildInfo) return;
            const eid:string=getParams(packet.topic,infor.ref)['eid']
            const devices:DeviceBasic[]=ChildInfo.map(id=>{
                const device:DeviceBasic={id,eid,type:_TYPE,values:[{id:'online',value:1}]};// online
                log(infor.id+" publish zbstatus2 ******** ")
                network.publish(`cmnd/${eid}/zbstatus2`,device.id)
                return device
            })
            log("%d result %s",infor.id,JSON.stringify(devices));
            driverService.onUpdate(devices,infor.id);
        },
    },
    ZbInfo:{
        /**
         *topic=tele/E8DB849DBFAE/SENSOR
         * payload={
         *      "ZbInfo":{
         *          "0x1067":{
         *              "Device":"0x1067", "IEEEAddr":"0x00124B0023B46876",
         *              "ModelId":"TH01", "Manufacturer":"eWeLink",
         *              "Endpoints":[1], "Config":["T01"],
         *              "Temperature":19.58, "Humidity":73.3,
         *              "Reachable":false, "BatteryPercentage":46,
         *              "BatteryLastSeenEpoch":1706318633, "LastSeen":8189,
         *              "LastSeenEpoch":1706318633, "LinkQuality":136
         *          }
         *      }
         * }
         */
        type:'update',
        name:'update sensor infor',
        ref:'tele/:eid/SENSOR',//tele/E8DB849DBFAE/SENSOR
        handler(client, packet, infor, driverService, network) {
            log("%d payload %s",infor.id,packet.payload.substring(0,100))
            const eid=getParams(packet.payload,infor.ref)['eid']
            const payload=JSON.parse(packet.payload);
            const zbInfor=payload['ZbInfo'];
            if(!zbInfor||typeof zbInfor!=='object') return ;//not case =>Ignore
               
            const devices:DeviceBasic[]=Object.keys(zbInfor).map(key=>{
               let {values,...others}=getZbInfor(zbInfor[key])
               values=[...values,{id:'online',value:1}]
               const device:DeviceBasic= {...others,values,eid,type:_TYPE}
               return device;
            })
            log("%d result %s",infor.id,JSON.stringify(devices));
            driverService.onUpdate(devices,infor.id);
            
        },
    },
    zbstatus2:{
        // toppic:stat/E8DB849DBFAE_fb/RESULT
        // payload: {"ZbStatus2":[{"Device":"0x1067","IEEEAddr":"0x00124B0023B46876","ModelId":"TH01","Manufacturer":"eWeLink","Endpoints":[1],"Config":["T01"]}]}
        type:'update',
        name:'maping zigbee',
        ref:'stat/:eid/RESULT',
        handler(client, packet, infor, driverService, network) {
            log("%d payload %s",infor.id,packet.payload)
            const eid:string=getParams(packet.topic,infor.ref)['eid']
            const payload=JSON.parse(packet.payload);
            const ZbStatus2=payload.ZbStatus2;
            if(!ZbStatus2||typeof ZbStatus2!=='object') return;
            const device:DeviceBasic=getZbInfor(ZbStatus2[0]);
            log("%d log infor {device:%s,eid:%s}",infor.id,device,eid);
            driverService.onUpdate([device],infor.id);
        },
    },
    status34:{
        // toppic:tele/E8DB849DBFAE/RESULT
        // payload: {"ZbState":{"Status":34,"IEEEAddr":"0x00124B002396E6B4","ShortAddr":"0x1FAB","ParentNetwork":"0x0000","JoinStatus":1,"Decision":0}}
        type:'update',
        name:'update maping address',
        ref:'tele/:eid/RESULT',
        handler(client, packet, infor, driverService, network) {
            log("%d payload %s",infor.id,packet.payload.substring(0,100))
            const eid:string=getParams(packet.topic,infor.ref)['eid']
            const payload=JSON.parse(packet.payload);
            const ZbState=payload.ZbState;
            if(!ZbState||typeof ZbState!=='object') return;
            const Status=ZbState.Status;
            if(Status!==34) return;
            const device:DeviceBasic={...getZbInfor(ZbState),eid,type:_TYPE};
            log("%d result %s",infor.id,JSON.stringify(device));
            driverService.onUpdate([device],infor.id)
        },
    },
    status30:{
        // toppic:tele/E8DB849DBFAE/RESULT
        // payload: {"ZbState":{"Status":30,"IEEEAddr":"0x00124B002396E6B4","ShortAddr":"0x1FAB","PowerSource":false,"ReceiveWhenIdle":false,"Security":false}}
        type:'update',
        name:'update maping address',
        ref:'tele/:eid/RESULT',
        handler(client, packet, infor, driverService, network) {
            log("%d payload %s",infor.id,packet.payload.substring(0,100))
            const eid:string=getParams(packet.payload,infor.ref)['eid']
            const payload=JSON.parse(packet.payload);
            const ZbState=payload.ZbState;
            if(!ZbState||typeof ZbState!=='object') return;
            const Status=ZbState.Status;
            if(Status!==30) return;
            const guide=[{k:'IEEEAddr',n:'id'},{k:'ShortAddr',n:'address'}]
            const device:DeviceBasic={...extractObject(ZbState,guide),eid,type:_TYPE};
            log("%d result %s",infor.id,JSON.stringify(device));
            driverService.onUpdate([device],infor.id)
        },
    },
    status66:{
        // tele/E8DB849DBFAE/RESULT
        // {"ZbRouteError":{"ShortAddr":"0x1067","Status":66,"StatusMessage":"MAC_INDIRECT_TIMEOUT"}}
        type:'connect',
        name:'connect error=>zigbee to offline',
        ref:'tele/:eid/RESULT',
        handler(client, packet, infor, driverService, network) {
            log("%d paload %s",infor.id,packet.payload.substring(0,100));
            const eid:string=getParams(packet.topic,infor.ref)['eid'];
            const payload=JSON.parse(packet.payload);
            const ZbRouteError=payload.ZbRouteError;
            if(!ZbRouteError||typeof ZbRouteError!=='object') return;
            const Status=ZbRouteError.Status;
            if(Status!==66) return;
            const search:Partial<DeviceBasic>={...getZbInfor(ZbRouteError),eid,type:_TYPE};
            const values:ValuesBasic[]=[{id:'online',value:0}]  ; //offline
            const device:Partial<DeviceBasic>={eid,type:_TYPE,values}
            log("%d result %s",infor.id,JSON.stringify({search,device}))
            driverService.onUpdateBySearch(device,search,infor.id)
        },
    },
    test:{
        // test
        type:'test',
        name:'testing',
        ref:'tasmota/discovery/:eid/sensors',
        handler(client, packet, infor, driverService, network) {
            log("%d %s",infor.id,packet.payload.substring(0,100))
            
        },
    }
}

////////////// CONTROLS ////////////////////////////
const control:DriverControl={
    power(idvs:DeviceRemote|DeviceRemote[],network:CommonNetwork){
        toArray(idvs).forEach(idv=>{
            if(idv.type!==_TYPE) return;
            const value=idv.values.find(v=>v.id==='power');
            if(!value) return;
            const payload={Device:idv.address,Send:{Power:value.value}}
            network.publish(`cmnd/${idv.eid}/send`,payload)
        })
    }
}

////////////////// MAIN FUNCTION //////////////
export default function startup():DriverPacket{
    // const services:DriverHook[]=Object.keys(serviceDb).map(key=>Object.assign({},serviceDb[key],{id:key}))
    return {services,networkIds:_NETWORK_IDs,control,type:_TYPE}
}

//////// MINI FUNCTIONS //////////////////////

/** extract information from object */
function extractObject(obj:object,guides:GuideData|GuideData[]){
    const _guides:GuideData[]=toArray(guides)
    const out:any={}
    //console.log("\n\n+++ tasmota-zigbee.ts-255 +++\n%s step0 ","extractObj",{obj,_guides})
    Object.keys(obj).forEach(key=>{
        const guide=_guides.find(g=>g.k===key);
        if(!guide) return ;// except list => Ignore
        let val=(obj as any)[key];
        if(guide.fn && typeof guide.fn==='function') val=guide.fn(val,guide)
        out[guide.n]=val;
        // console.log("\n\n+++ tasmota-zigbee.ts-261 +++\n%s step1 ","extractObj",{key,guide,val,out})
    })
    return out;
}

function getZbInfor(obj:object){
    const _dvObj=extractObject(obj,dvKeys);
    const _vlObj=extractObject(obj,vlKeys)
    //log("%d device infor","getZbInfor", dvKeys,_dvObj,vlKeys,_vlObj)
    const values:ValuesBasic[]=Object.keys(_vlObj).map(key=>Object.assign({},{id:key,value:_vlObj[key]}))

    return {..._dvObj,values}
}

interface GuideData{
    k:string;       // key for search
    n:string;       // name
    fn?:(value:any,inf:GuideData)=>any;
}