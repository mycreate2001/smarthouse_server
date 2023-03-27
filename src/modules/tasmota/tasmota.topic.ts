import { PublishPacket } from "packet";
import { Device, DeviceStatus, Equipment } from "../device/device.interface";

interface SensorDb{
    [shortAddr:string]:string;//
}

const sensorDb:SensorDb={}

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
    },
    /** sensor */
    {
        //{"ZbParent":{"Device":"0x0000","Children":3,"ChildInfo":["0x00124B002396E6B4","0xA4C138E9B1287758","0x00124B0023B46876"]}}
        name:'address of sensor',
        topic:'tele/:id/RESULT',
        handle(packet:PublishPacket,client:any,network:any){
            const obj=JSON.parse(packet.payload.toString());
            const ZbParent=obj["ZbParent"]
            if(!ZbParent) return;
            const ChildInfo=ZbParent.ChildInfo;
            console.log("\n++++ tasmota.topic.ts-71 +++ \nchildInfor:",ChildInfo,"--------------------\n")
        }
    },
    {
        //payload:{"ZbState":{"Status":34,"IEEEAddr":"0xA4C138E9B1287758","ShortAddr":"0xB2A2","ParentNetwork":"0x0000","JoinStatus":1,"Decision":0}}
        name:'paring address',
        topic:'tele/:id/RESULT',
        handle(packet:PublishPacket,client:any,network:any){
            //1. input
            const obj=JSON.parse(packet.payload.toString());
            //2. verify
            const ZbState=obj.ZbState;
            if(!ZbState) return;
            const Status=ZbState.Status;
            if(Status!==34) return;//not
            const fullAddr=ZbState.IEEEAddr;
            const shortAddr=ZbState.ShortAddr;
            console.log("\n+++ tasmota.topic.ts-88 ++++ %s\n",this.name,{fullAddr,shortAddr},"\n-------------------------\n")
            sensorDb[shortAddr]=fullAddr;
        }
    },
    {   
        //{"ZbReceived":{"0xB2A2":{"Device":"0xB2A2","Temperature":24.91,"Humidity":71.83,"Endpoint":1,"LinkQuality":74}}}
        //tele/E8DB849DBFAE/SENSOR
        name:'sensor status',
        topic:'tele/:id/SENSOR',
        handle(packet:PublishPacket,client:any,network:any){
            const obj=JSON.parse(packet.payload.toString())
            const ZbReceived=obj.ZbReceived;
            if(!ZbReceived) return;
            let sensors:any[]=Object.keys(ZbReceived).map(key=>ZbReceived[key]);
            sensors=sensors.map(sensor=>{
                const id=sensorDb[sensor.Device]||sensor.Device;
                return {...sensor,id}
            })
            console.log("\n+++ tasmota.topic.ts-101 %s sensors:",this.name,sensors,"\n-------------------------------\n")
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