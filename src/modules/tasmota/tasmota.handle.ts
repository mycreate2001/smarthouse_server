import aedesServer from "aedes:server";
import { PublishPacket } from "packet";
import { createLog } from "../../lib/log";
import { wildcard } from "../../lib/wildcard";
import { DeviceStatus } from "../device/device.interface";
import { NetworkConnect,NetworkConfig,NetworkUpdate } from "../network/network";
const log=createLog("tamosta-handle","center")
import topics from "./tasmota.topic";


export class Tasmota{
    mqtt:aedesServer
    constructor(mqtt:aedesServer){
        this.mqtt=mqtt;
        this.mqtt.on("publish",(packet:PublishPacket,client:any)=>{
            if(packet.cmd!='publish') return;
            packet.payload=packet.payload.toString()
            this.dispatch(packet,client);
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
        const id=_arrs[1]||1
        const packet:PublishPacket={
            cmd:'publish',
            payload:'?',
            topic:`cmnd/${eid}/POWER${id}`,
            qos:0,
            retain:false,
            dup:false
        }
        this.publish(packet)
    }

    publish=this._publish
    
    _publish(packet:PublishPacket){
        this.mqtt.publish(packet,(err)=>{
            if(err) return log("publish %s=>error %s",packet.topic,err.message);
            log("_publish %s =>success",packet.topic)
        })
    }

    
    dispatch(packet:PublishPacket,client:any){
        const server=this;
        try{
            const beCalls=topics.filter(handle=>!!handle.handle && wildcard(packet.topic,handle.topic))
            beCalls.forEach(handle=>handle.handle(packet,client,server))
            return beCalls.length;
        }
        catch(err){
            const msg:string=err instanceof Error?err.message:"other error"
            log("dispatch ### ERROR:%s",msg);
            return 0;
        }
    }
}
