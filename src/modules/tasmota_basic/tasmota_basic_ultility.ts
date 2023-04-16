import { DeviceTasmotaBasic } from "./tasmota_basic.interface";


export function getDevice(payload:string,type:string):DeviceTasmotaBasic[]{
    const devices:DeviceTasmotaBasic[]=[];
    const obj=JSON.parse(payload);
    const equipment={
        id:obj.mac as string,
        name:obj.dn as string,
        names:obj.fn as string[],
        ipAddr:obj.ip,
        mac:obj.mac as string,
        model:obj.md as string,
        fns:obj.state as string[],
        version:obj.sw as string,
        online:true,
    }
    equipment.names.forEach((name,pos)=>{
        if(!name) return;
        devices.push({
            id:equipment.id+"@"+(pos+1),
            name,
            online:equipment.online,
            fns:equipment.fns,
            status:0,
            model:equipment.model,
            ipAddr:equipment.ipAddr,
            mac:equipment.mac,
            linkQuality:0,
            modelId:equipment.model,
            type,
            updateList:["status"],
            eid:equipment.mac
        })
    })
    return devices
}