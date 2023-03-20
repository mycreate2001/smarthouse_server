import aedesServer from "aedes:server";
import { PublishPacket } from "packet";
import { createLog } from "../../lib/log";
import { getParams, wildcard } from "../../lib/wildcard";
import { Device, DeviceStatus, Equipment } from "../device/device.interface";
import { NetworkConnect,NetworkConfig,NetworkUpdate } from "../network/network";
const log=createLog("tamosta-handle","center")
export class Tasmota{
    mqtt:aedesServer
    constructor(mqtt:aedesServer){
        this.mqtt=mqtt;
        this.mqtt.on("publish",(packet:PublishPacket,client:any)=>{
            if(packet.cmd!='publish') return;
            packet.payload=packet.payload.toString()
            const result=dispatch(packet,client,this);
            if(!result) log("%s not be handle\n",packet.topic,packet)
        })
    }
    onConnect:NetworkConnect=(online,client,server)=>null;
    onUpdate:NetworkUpdate=(sttInfor,client,server)=>null;
    onConfigure:NetworkConfig=(packet,client,server)=>null;
    remote(stt:DeviceStatus){
        const _arrs=stt.id.split("@");
        const eid=_arrs[0];
        const id=_arrs[1];
        const status=stt.status?"ON":"OFF"
        // const status="TOGGLE"
        const packet:PublishPacket={
            // topic:`cmnd/${eid}/POWER${id}`,
            topic:`cmnd/${eid}/Power`,
            payload:status,
            qos:0,
            retain:false,
            dup:false,
            cmd:'publish'
        }
        this.mqtt.publish(packet,(err)=>console.log("\n### tasmota.handle.ts-35\nerr:",err));
    }
    getInfor(deviceId:string){
        const _arrs=deviceId.split("@")
        const eid=_arrs[0];
        const id=_arrs[1]
        const packet:PublishPacket={
            cmd:'publish',
            payload:'?',
            topic:`cmnd/${eid}/Power${id}`,
            qos:0,
            retain:false,
            dup:false
        }
        this.mqtt.publish(packet,(err)=>{
            const result:string=err?"failed":"success";
            console.log("\n#### getInfor:%s =>%s",deviceId,result,{_arrs,packet})
        })
    }
}

const handles=[
    {
        name:'online',
        topic:'tele/:id/LWT',
        handle(packet:PublishPacket,client:any,network:Tasmota){
            const str=packet.payload.toString();
            const online=str.toLowerCase()==='online';
            network.onConnect(online,client,network)
        }
    },
    {
        name:'configure',
        topic:'tasmota/discovery/:id/config',
        handle(packet:PublishPacket,client:any,network:Tasmota){
            const equipment=getEquipment(packet.payload.toString());
            const devices=getDeviceFromEquipment(equipment);
            network.onConfigure(equipment,devices,client,network)
        }
    },
    {
        name:'result',
        topic:'stat/:id/RESULT',//stat/E8DB8494B051/RESULT //tele/:id/STATE
        handle(packet:PublishPacket,client:any,network:Tasmota){
            const payload=JSON.parse(packet.payload.toString())
            const list:string[]=['','1','2','3','4','5','6','7','8']
            const outs:number[]=[]
            list.every(x=>{
                const temp=payload['POWER'+x]
                if(temp==undefined&&!x) return true;
                if(temp==undefined) return false;
                const val=temp==='ON'?1:0
                outs.push(val) 
            })
            const id=getParams(packet.topic,this.topic).id;
            const _results:DeviceStatus[]=outs.map((status,pos)=>{
                return {id:id+"@"+pos,status}
            })
            network.onUpdate(_results,client,network)
        }
    },
    {
        name:'state',
        topic:'tele/:id/STATE',//stat/E8DB8494B051/RESULT //tele/:id/STATE
        handle(packet:PublishPacket,client:any,network:Tasmota){
            const payload=JSON.parse(packet.payload.toString())
            const list:string[]=['','1','2','3','4','5','6','7','8']
            const outs:number[]=[]
            list.every(x=>{
                const temp=payload['POWER'+x]
                if(temp==undefined&&!x) return true;
                if(temp==undefined) return false;
                const val=temp==='ON'?1:0
                outs.push(val) 
            })
            const id=getParams(packet.topic,this.topic).id;
            const _results:DeviceStatus[]=outs.map((status,pos)=>{
                return {id:id+"@"+pos,status}
            })
            network.onUpdate(_results,client,network)
        }
    }
]


function dispatch(packet:PublishPacket,client:any,server:any){
    try{
        const beCalls=handles.filter(handle=>!!handle.handle && wildcard(packet.topic,handle.topic))
        beCalls.forEach(handle=>handle.handle(packet,client,server))
        return beCalls.length;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        log("dispatch ### ERROR:%s",msg);
        return 0;
    }
}

/**
 {"ip":"192.168.137.131","dn":"Tasmota","fn":["Tasmota","Tasmota2","Tasmota3",null,null,null,null,null],"hn":"E8DB8494B051-4177","mac":"E8DB8494B051","md":"Sonoff T1 3CH","ty":0,"if":0,"ofln":"Offline","onln":"Online","state":["OFF","ON","TOGGLE","HOLD"],"sw":"12.4.0","t":"E8DB8494B051","ft":"%prefix%/%topic%/","tp":["cmnd","stat","tele"],"rl":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"swc":[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],"swn":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"btn":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"so":{"4":0,"11":0,"13":0,"17":0,"20":0,"30":0,"68":0,"73":0,"82":0,"114":0,"117":0},"lk":0,"lt_st":0,"sho":[0,0,0,0],"sht":[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],"ver":1}
 */
function getEquipment(payload:string):Equipment{
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


function getDeviceFromEquipment(equipment:Equipment):Device[]{
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