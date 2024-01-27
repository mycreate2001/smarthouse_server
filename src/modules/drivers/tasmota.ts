import { getParams, toArray } from "ultility-tools";
import { DriverControl, DriverHook, DriverPacket } from "../../interface/device-service.interface";
import { createLog } from "advance-log";
import { DeviceBasic,DeviceRemote } from "../../interface/device.interface";
import { CommonNetwork } from '../../interface/network.interface'
const _TYPE='tasmota-basic'
const log=createLog(_TYPE)
const _NETWORK_IDs=['mqtt']
const _SEPARATE_KEY="@"
const _FEED_BACK_TOPIC="_fb"
const services:DriverHook[]=[
    {
        id:'connect',
        name:'tasmota connect',
        ref:'tele/:eid/LWT',
        handler(client, packet, infor, driverService, network) {
            const topic=packet.topic
            const eid:string=getParams(topic,infor.ref)['eid'];
            const online=packet.payload.toLowerCase()==='online'?true:false
            driverService.onConnect(eid,online)
        },
    },
    {
        id:'update',
        name:"update config",
        ref:'tasmota/discovery/:eid/config',
        handler(client, packet, infor, driverService, network) {
            const payload=packet.payload;
            // log("config/test1 ",payload);
            const equipment=getEquipment(JSON.parse(payload));
            const devices=getDevice(equipment);
            driverService.onUpdate(devices);
        },
    },
    {
        id:'update',
        name:"update power",
        ref:'tele/:eid/STATE',
        handler(client, packet, infor, driverService, network) {
            const payload=typeof packet.payload==='string'?JSON.parse(packet.payload):packet.payload;
            const eid=getParams(packet.topic,infor.ref)['eid']
            const devices=getUpdatePower(payload,eid);
            log("update devices ",devices);
            driverService.onUpdate(devices);
        },
    },
    {
        id:'update',
        name:"update power",
        ref:'stat/:eid/RESULT',
        handler(client, packet, infor, driverService, network) {
            const payload=typeof packet.payload==='string'?JSON.parse(packet.payload):packet.payload;
            const eid=getParams(packet.topic,infor.ref)['eid']
            const devices=getUpdatePower(payload,eid);
            log("update devices ",devices);
            driverService.onUpdate(devices);
        },
    },
    //{"Info1":{"Module":"Sonoff 4CHPROR3","Version":"13.3.0(tasmota)","FallbackTopic":"cmnd/E8DB8494ED16_fb/","GroupTopic":"cmnd/tasmotas/"}}
    // {
    //     id:'update',
    //     name:"update power",
    //     ref:'stat/:eid/RESULT',
    //     handler(client, packet, infor, driverService, network) {
    //         const payload=typeof packet.payload==='string'?JSON.parse(packet.payload):packet.payload;
    //         const eid=getParams(packet.topic,infor.ref)['eid']
    //         const devices=getUpdatePower(payload,eid);
    //         log("update devices ",devices);
    //         driverService.onUpdate(devices);
    //     },
    // }
];

const control:DriverControl={
    power(idvs:DeviceRemote|DeviceRemote[],network:CommonNetwork){
        toArray(idvs).forEach(idv=>{
            if(idv.type!==_TYPE) return;
            const value=idv.values.find(v=>v.id==='power');
            if(!value) return;
            const arr=idv.id.split(_SEPARATE_KEY);
            const topic:string=`cmnd/${arr[0]}${_FEED_BACK_TOPIC}/power${arr[1]}`
            network.publish(topic,value.value?"on":"off")
        })
        
    },
    
}

///////////// MAIN ////////////////////
export default function startup(inf:any):DriverPacket{
    return {services,control,type:_TYPE,networkIds:_NETWORK_IDs}
}


//////////// MINI FUNCTIONS /////////////////

/** get equipment from payload */
function getEquipment(payload:object):EquipmentData{
    // log("004: payload ",{payload})
    const list:ListData[]=[
        {n:"address",k:"ip"},{n:"mac",k:"mac"},
        {n:"id",k:"t"},{n:"model",k:"md"},
        {n:"names",k:"fn",fn:(val:string[])=>{
            if(!Array.isArray(val)) return [];
            return val.filter(x=>x!==null)
        }}
    ]
    const out:any={}
    list.forEach(l=>{
        let val=(payload as any)[l.k];
        if(val==undefined) return;
        if(l.fn && typeof l.fn==='function') {
            val=l.fn(val)
            // log("test-004 ",{val})
        }
        (out as any)[l.n]=val;
    })
    out.type=_TYPE;
    return out;
}


/** get device from equipment */
function getDevice(equipment:EquipmentData):DeviceBasic[]{
    const devices:DeviceBasic[]=[];
    const {id,address,model,mac,names} =equipment
    names.forEach((name,pos)=>{
        const device:DeviceBasic={
            id:id+_SEPARATE_KEY+(pos+1),
            name,
            eid:id,
            model,
            address,
            mac,
            type:_TYPE
        }
        devices.push(device);
    })

    return devices;
}

/**
 * 
 * @param payload {"Time":"2024-01-26T16:06:00","Uptime":"0T00:00:08","UptimeSec":8,"Heap":26,"SleepMode":"Dynamic","Sleep":50,"LoadAvg":19,"MqttCount":1,"POWER1":"OFF","POWER2":"OFF","POWER3":"OFF","POWER4":"OFF","Wifi":{"AP":1,"SSId":"Full House1","BSSId":"0A:6A:C5:7B:F1:38","Channel":6,"Mode":"11n","RSSI":92,"Signal":-54,"LinkCount":1,"Downtime":"0T00:00:03"}}
 */
function getUpdatePower(payload:object,eid:string):DeviceBasic[]{
    const devices:DeviceBasic[]=[]
    Object.keys(payload).forEach(key=>{
        if(!key.toLowerCase().startsWith("power")) return; //not power
        const pos:number=parseInt(key.substring(key.length-1))||1;
        const value=((payload as any)[key]+"").toUpperCase()==='ON'?1:0
        const device:DeviceBasic={
            id: eid+_SEPARATE_KEY+pos,
            values:[{id:'power',value}]
        }
        devices.push(device)

    })
    return devices;
}


///////////////////////////////////////////////
interface EquipmentData{
    id:string;
    mac:string;
    address:string;
    model:string;
    names:string[];
}

interface ListData{
    n:string;       // name
    k:string;       // key
    fn?:(value:any|any[])=>any
}