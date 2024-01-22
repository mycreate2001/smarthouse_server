import { getParams } from "ultility-tools";
import { DriverControl, DriverHook, DriverPacket } from "../../interface/driver.interface";
import { createLog } from "advance-log";
import { DeviceBasic } from "../../interface/device.interface";
const _TYPE='tasmota-basic'
const log=createLog(_TYPE)
const _NETWORK_ID='mqtt'
const _SEPARATE_KEY="@"
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
            log("config/test2 ",devices);
            driverService.onUpdate(devices);
        },
    }
];

const control:DriverControl={
    
}


///////////// MAIN ////////////////////
export default function startup(inf:any):DriverPacket{
    return {services,control,type:_TYPE,networkId:_NETWORK_ID}
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
        log("test-003 ",{val,l})
        if(val==undefined) return;
        if(l.fn && typeof l.fn==='function') {
            val=l.fn(val)
            // log("test-004 ",{val})
        }
        (out as any)[l.n]=val;
    })

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
            mac
        }
        devices.push(device);
    })

    return devices;
}


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