import { PublishPacket } from "packet";
import { Device, DeviceStatus, Equipment } from "../device/device.interface";

const topics=[
    {
        name:'online',
        topic:'tele/:id/LWT',
        handle(packet:PublishPacket,client:any,network:any){
            const str=packet.payload.toString();
            const online=str.toLowerCase()==='online';
            network.onConnect(online,client,network)
        }
    },
    {
        name:'configure',
        topic:'tasmota/discovery/:id/config',
        handle(packet:PublishPacket,client:any,network:any){
            const equipment=getEquipment(packet.payload.toString());
            const devices=getDeviceFromEquipment(equipment);
            network.onConfigure(equipment,devices,client,network);
            devices.forEach(dv=>network.getInfor(dv.id));
        }
    },
    {
        name:'result',
        topic:'stat/:id/RESULT',//stat/E8DB8494B051/RESULT //tele/:id/STATE
        handle(packet:PublishPacket,client:any,network:any){
            const payload=JSON.parse(packet.payload.toString());
            
            //{"POWER2":"OFF"}
            const stts:DeviceStatus[]=[];
            const eid:string=client.id||""
            Object.keys(payload).forEach(key=>{
                if(!key.startsWith("POWER")) return
                const a=key.substring(key.length-1);
                const id=parseInt(a)||1
                const status=payload[key]=="ON"?1:0
                stts.push({id:eid+"@"+id,status})
            })
            if(stts.length) network.onUpdate(stts,client,network);
        }
    },
    {
        name:'state',
        topic:'tele/:id/STATE',//tele/E8DB8494B051/STATE
        handle(packet:PublishPacket,client:any,network:any){
            const payload=JSON.parse(packet.payload.toString())
            const stts:DeviceStatus[]=[];
            const eid:string=client.id||""
            Object.keys(payload).forEach(key=>{
                if(!key.startsWith("POWER")) return
                const a=key.substring(key.length-1);
                const id=parseInt(a)||1
                const status=payload[key]=="ON"?1:0
                stts.push({id:eid+"@"+id,status})
            })
            console.log("\n++++ tasmota.handle.ts-109 ++++",{stts})
            if(stts.length) network.onUpdate(stts,client,network);
        }
    }
];

export default topics;

/**
 {"ip":"192.168.137.131","dn":"Tasmota","fn":["Tasmota","Tasmota2","Tasmota3",null,null,null,null,null],"hn":"E8DB8494B051-4177","mac":"E8DB8494B051","md":"Sonoff T1 3CH","ty":0,"if":0,"ofln":"Offline","onln":"Online","state":["OFF","ON","TOGGLE","HOLD"],"sw":"12.4.0","t":"E8DB8494B051","ft":"%prefix%/%topic%/","tp":["cmnd","stat","tele"],"rl":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"swc":[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],"swn":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"btn":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"so":{"4":0,"11":0,"13":0,"17":0,"20":0,"30":0,"68":0,"73":0,"82":0,"114":0,"117":0},"lk":0,"lt_st":0,"sho":[0,0,0,0],"sht":[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],"ver":1}
 */
export function getEquipment(payload:string):Equipment{
    const obj=JSON.parse(payload);
    const equipment:Equipment={
        id:obj.mac,
        name:obj.dn,
        names:obj.fn as string[],
        ip:obj.ip,
        mac:obj.mac,
        model:obj.md,
        states:obj.state,
        version:obj.sw,
        online:true
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
            states:equipment.states,
            status:0
        })
    })
    return devices
}