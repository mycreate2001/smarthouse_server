import { createDebug, createLog } from "advance-log";
import { DriverControl, DriverHook, DriverPacket } from "../../interface/driver.interface";
import { getParams } from "ultility-tools";
import { CommonClient } from "../../interface/network.interface";
import { Device, DeviceOpt } from "../../interface/device.interface";

const _LABEL="mqtt-driver"
const _DEVICE_TYPE="tasmota1"
const debug=createDebug(_LABEL,1);
const log=createLog(_LABEL,{enablePos:true})

////////////// HOOK SERVICES ///////////////
export const services:DriverHook[]=[
    {
        id:'connect',
        name:"connect of device",
        ref:'tele/:eid/LWT',
        handler(client, packet, inf,driver) {
            const topic=packet.topic
            const eid:string=getParams(topic,inf.ref)['eid'];
            const online=packet.payload.toLowerCase()==='online'?true:false
            debug(1,"connect {eid:%s,online:%d}",eid,online);
            driver.connect(eid,online)
        },
    },

    {
        id:'config',
        name: "update",
        ref: "tasmota/discovery/:eid/config",
        handler(client, packet, inf, driverService) {
            const payload=JSON.parse(packet.payload);
            const equipment=getEquipmentInf(payload);
            const devices=getDeviceInf(equipment);
            driverService.update(devices);
            log("%d %s",client.id,inf.id,{devices})
        }
    },
    {   
        id:'update',
        name: "update state",
        ref: "stat/:eid/RESULT",
        handler(client: CommonClient, packet, inf, driverService) {
            const payload=JSON.parse(packet.payload);
            const status=GetStatus(payload);
            log("%d %s",client.id,inf.id,{status,payload})

        }
    },

    {   
        id:'update',
        name: "update state",
        ref: "tele/:eid/STATE",
        handler(client: CommonClient, packet, inf, driverService) {
            const payload=JSON.parse(packet.payload);
            const status=GetStatus(payload);
            debug(1,{status,payload})

        }
    },

    {
        id:'update',
        name:'update feedback topic',
        ref:'tele/:eid/INFO1',
        handler(client, packet, infor, driverService) {
            const payload=JSON.parse(packet.payload);
            const info=payload.Info1;
            const list=[{n:"fallbackTopic",k:"FallbackTopic"},{n:"groupTopic",k:"GroupTopic"}]
            const out:any={}
            list.forEach(item=>{
                const val=info[item.k];
                if(val===undefined) return;
                out[item.n]=val;
            })

            log("infor1",out);
        },
    },

    {
        id:'test-send',
        name:'test send',
        ref:'cmnd/#',
        handler(client, packet, infor, driverService) {
            //cmnd/E8DB8494ED16_fb
        },
    }

]

///////////// CONTROLS /////////////////////
const control:DriverControl={
    status(id:string,status:number){

    }
}

//////////// MAIN FUNCTIONS ////////////
export default function startup(inf:any):DriverPacket{
    return {services,type:_DEVICE_TYPE,control}
}


//////////////// MINI FUNCTIONS /////////////
/** get equipment information */
function getEquipmentInf(payload:object):Equipment{
    const list= [
        {n:'model',k:'md'},{n:'mac',k:'mac'},
        {n:'address',k:'ip'},{n:'names',k:'fn',fn:(val:any)=>{
            if(!Array.isArray(val)) return val;
            const list:string[]=[];
            val.forEach((item,i)=>{
                if(item===null) return;
                if(item==='') list.push(i+'');
                else list.push(item);
            })
            return list;
        }},
        {n:'version',k:'sw'},
        {n:'id',k:'t'}
    ]
    
    const out:any={}
    list.map(item=>{
        let val=(payload as any)[item.k];
        if(val===undefined) return;
        if(item.fn && typeof item.fn==='function') val=item.fn(val)
        out[item.n]=val;
    })
    out.type=_DEVICE_TYPE;
    return out;
}

/** get device infor */
function getDeviceInf(equipment:Equipment):DeviceOpt[]{
    return equipment.names.map((name,i)=>{
        const device:DeviceOpt={
            id: equipment.id + '@' + i,
            type:equipment.type,
            name,
            eid: equipment.id,
            model:equipment.model,
            address:equipment.address,
        }
        return device;
    })
}

function GetStatus(payload:object){
    const outs:{id:number,status:number}[]=[];
    Object.keys(payload).forEach(key=>{
        const _key=key.toLowerCase();
        if(!_key.startsWith("power")) return;
        
        const id:number=parseInt(_key.substring(_key.length-1))||1
        const val=(payload as any)[key]+""
        const status=val.toLowerCase()==='on'?1:0
        outs.push({id,status})
    })

    return outs;
}

/////////////// INTERFACE ///////////////////

interface Equipment{
    id:string;              // id of device
    model:string;           // model
    type:string;            // tasmota, mqtt, socket...
    mac:string;             // MAC address
    address:string;         // ip or shortAddress
    names:string[];         // family name of each device
}