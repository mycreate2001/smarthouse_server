import { DataConnect, toArray } from "local-database-lite";
import { PublishPacket } from "packet";
import tEvent from "../../lib/event";
import { createLog } from "../../lib/log";
import { NetworkConfig, NetworkConnect, NetworkUpdate } from "../network/network";
import { Device, DeviceStatus } from "./device.interface";
const log=createLog("DeviceService","center")
export default class DeviceService extends tEvent{
    db:DataConnect<Device>;
    constructor(db:DataConnect<Device>){
        super();
        this.db=db;
    }
    add(devices:Device|Device[]){
        const _devices=toArray(devices);
       const all= _devices.map(device=>this.db.add(device,false))
       Promise.all(all).then(_=>this.db.commit())
    }
    onUpdate:NetworkUpdate=async (stts:DeviceStatus[],client,network)=>{
        // console.log("\n\n-------------- device.service.ts-20 debug -----------\n client %s network:",client.id,network,"\n------------------\n\n")
        const devices=await this.db.gets(stts.map(d=>d.id));
        const list:Device[]=[];
        stts.forEach(stt=>{
            const dv=devices.find(d=>d.id==stt.id);
            if(!dv) return log("[Warn] not exist device %d",stt.id);
            if(dv.status!==stt.status){
                /** change status */
                this.emit(stt.id+":"+stt.status,{before:dv.states,after:stt.status});
                dv.status=stt.status;
                list.push(dv);
                this.db.add(dv,false);
            }

        })

        if(list.length){
            log("update success ",list.map(d=>d.id+":"+d.status));
            // console.log("\n++++ device.service.ts-37 network:",network)
            const packet:PublishPacket={
                cmd:'publish',
                payload:JSON.stringify(list),
                qos:0,
                dup:false,
                retain:true,
                topic:'api/update'
            }
            network.publish(packet)
            this.db.commit();//save to database
        }

    }
    
    allDevices(){
       return  this.db.search
    }

    onConnect:NetworkConnect=async (online,client)=>{
        const eid=client.id||"";
        console.log("\n+++ device.service.ts-54 '%s' onConnect",client.id);
        if(!eid) return log("wrong client");
        const devices=await this.db.search({key:'id',type:'==',value:eid})
        devices.forEach(device=>{
            device.online=online;
            this.db.add(device,false);
        })
        if(devices.length){
            log("update connect status of eid:",eid);
            this.db.commit();//save value
        }
    }

    onConfigure:NetworkConfig=(equipment,devices,client,server)=>{
        log("new devices:",devices.map(d=>`${d.id}-${d.name}`));
        // temporarily add 
        this.add(devices)
    }
}