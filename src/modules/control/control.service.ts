import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import Config from "../configs/configs";
import { Device, DeviceStatus, Equipment } from "../device/device.interface";
import Network, { createPublishPacket } from "../network/network";
const log=createLog("control","center")
export class Control{
    network:Network
    deviceDb:DataConnect<Device>;
    config:Config
    // scriptDb
    constructor(network:Network,db:LocalDatabaseLite,config:Config){
        this.deviceDb=db.connect("devices");
        this.config=config;
        this.network=network;
        network.onConnect=(online,client,server)=>{this.onConnect(online,client)}
        network.onUpdate=(DeviceStatus,client,server)=>{this.onUpdate(DeviceStatus,client)}
        network.onConfigure=(equipment,devices,client,server)=>{this.onConfigure(equipment,devices,client)}
    }

    onConnect(online:boolean,client:any){
        log("onConnect")
        this.deviceDb.search({key:'eid',type:'==',value:client.id})
        .then(idvs=>{
            const alltasks=idvs.map(idv=>{
                idv.online=online;
                this.deviceDb.add(idv);
            })
            Promise.all(alltasks).then(idvs=>{
                if(idvs.length){
                    this.deviceDb.commit();
                    log("update status to ",idvs);
                    const payload=JSON.stringify({type:"update",data:idvs})
                    const topic=this.config.obj["_UPDATE_DEVICE"]
                    const packet=createPublishPacket({topic,payload})
                    this.network.publish(packet)
                }
                
            })
        })
        
    }

    onUpdate(status:DeviceStatus[],client:any){
        log("update status")
    }

    onConfigure(equipment:Equipment,devices:Device[],client:any){
        log("configure")
    }
}