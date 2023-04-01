import { Device, Equipment } from "../device/device.interface";

export function getEquipment(payload:string):Equipment{
    const obj=JSON.parse(payload);
    const equipment:Equipment={
        id:obj.mac,
        name:obj.dn,
        names:obj.fn as string[],
        ipAddr:obj.ip,
        mac:obj.mac,
        model:obj.md,
        fns:obj.state,
        version:obj.sw,
        online:true,

    }
    return equipment;
}

export function getDeviceFromEquipment(equipment:Equipment):Device[]{
    const devices:Device[]=[];
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
            mac:equipment.mac
        })
    })
    return devices
}