import { ModuleInfor, ModulePackage } from "../../lib/module-loader/module.interface";
import { createLog } from "../../lib/log";
import { PublishPacket } from "../interface.type";
import { Client } from "client";
import aedesServer from "aedes:server";
import { wildcard } from "../../lib/wildcard";
const log=createLog("tasmota");
export default function tamotas(infor:ModuleInfor,modules:ModulePackage[]){
    console.log("\n++++ %s +++\nmodules:",infor.name,modules);
    return 1
}

const handles=[
    {
        name:'sensors',
        topic:'tele/:id/SENSOR',
        type:'private',
        handle(packet:PublishPacket,client:any,server:aedesServer){
            try{
                //'{"ZbReceived":{"0xB2A2":{"Device":"0xB2A2","Temperature":28.14,"Humidity":56.33,"Endpoint":1,"LinkQuality":110}}}'
                const obj=JSON.parse(packet.payload.toString());
                const ZbReceived=obj.ZbReceived||{}
                Object.keys(ZbReceived).forEach(key=>{
                    const dv=ZbReceived[key];
                    const temp=dv.Temperature;
                    console.log("[handle/%s] ####",this.name);
                    if(temp) console.log("Temperature:",temp)
                    const humi=dv.Humidity;
                    if(humi) console.log("Humindity:",humi);
                })
            }
            catch(err){}
        }
    },
    {
        name:'config',
        topic:'tasmota/discovery/:id/config',
        handle(packet:PublishPacket,client:any,server:aedesServer){
            const equipment=getEquipment(packet.payload.toString())
            if(!equipment) return;
            console.log("--- equipment ---\n",equipment);
            const devices=getDevicesFromEquipment(equipment);
            console.log("--- devices ---");
            console.table(devices)
        }
    },
    {
        name:'infor1',
        topic:'tele/:id/INFO1',
        handle(packet:PublishPacket,client:any,server:aedesServer){
            packet.payload=packet.payload.toString();
            //{"Info1":{"Module":"Sonoff ZbBridge","Version":"12.2.0(zbbridge)","FallbackTopic":"cmnd/E8DB849DBFAE_fb/","GroupTopic":"cmnd/tasmotas/"}}
            try{
                const payload=JSON.parse(packet.payload);
                const infor1=payload.Info1;
                log("------ INFOR1 ------\n",infor1)

            }
            catch(err){
                log("[infor1-debug] ### ERROR ###")
            }
        }
    },
    {
        name:'connect status',
        topic:'tele/:id/LWT',
        handle(packet:PublishPacket,client:any,server:aedesServer){
            const payload=packet.payload.toString();
            const status=payload.toLowerCase()=='online'?true:false;
            log("handle/%s: connect=%b",this.name,status)
        }
    }

]

function dispath(packet:PublishPacket,client:Client,server:aedesServer){
    const topic=packet.topic;
    handles.forEach(handle=>{
        if(!wildcard(topic,handle.topic)) return;
        handle.handle(packet,client,server)
    })
}

interface Equipment{
    id:string;              //mac
    name:string;            //dn
    familyName:string[];    //fn
    ip:string;              //ip
    mac:string;             //mac
    states:string[];        //state
    model:string;           //md
    topics:string[];        //tp
    onlineStr:string;       //onln,
    buttons:number[];
    version:string;
}

interface Device{
    id:string;
    eid:string;
    name:string;
    states:string[];
    model:string;
    state:number;
}

function getEquipment(payload:string):Equipment|undefined{
    try{
        const obj=JSON.parse(payload);
        const equipment:Equipment={
            id:obj.mac,
            name:obj.dn,
            familyName:obj.fn,
            ip:obj.ip,
            mac:obj.mac,
            states:obj.state,
            model:obj.md,
            topics:obj.tp,
            onlineStr:obj.onln,
            buttons:obj.btn,
            version:obj.sw
        }
        return equipment
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        console.log("[getEquipment] ### ERROR-01 ### ",msg);
        return;
    }
}


function getDevicesFromEquipment(equipment:Equipment):Device[]{
    const length=equipment.familyName.filter(n=>n).length;
    const devices:Device[]=[];
    for(let i=0;i<length;i++){  
        const dv:Device={
            id:equipment.id+"@"+i,
            eid:equipment.id,
            name:equipment.familyName[i],
            states:equipment.states,
            model:equipment.model,
            state:equipment.buttons[i]
        }
        devices.push(dv)
    }
    return devices
}