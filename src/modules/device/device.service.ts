import LocalDatabaseLite, { DataConnect, toArray } from "local-database-lite";
import { PublishPacket } from "packet";
import tEvent from "../../lib/event";
import { createLog } from "../../lib/log";
import Config from "../configs/configs";
import Network, { NetworkConfig, NetworkConnect, NetworkUpdate } from "../network/network";
import { Device, DeviceDb, DeviceStatus, Equipment } from "./device.interface";

const _DEVICE_DB_="devices"
const _UPDATE_TOPIC_="api/update"
const log=createLog("DeviceService","center")

export default class DeviceService extends tEvent{
    db:DataConnect<Device>;
    network:Network;
    ndevices:DeviceDb={};
    constructor(network:Network,db:LocalDatabaseLite,config:Config){
        super();
        this.db=db.connect(_DEVICE_DB_);
        this.network=network
        network.onConnect=(online,client,server)=>{
            this.onConnect(online,client)
        }
        network.onUpdate=(status,client,server)=>{
            this.onUpdate(status,client)
        }

        network.onConfigure=(equipment,devices,client,server)=>{
            this.onConfigure(equipment,devices,client)
        }
        network.update();//
    }

    onConnect(online:boolean,client:any){
        const list:string[]=[]
        return this.db.search({key:'eid',type:'==',value:client.id})
        .then(idvs=>{
            const allTask=idvs.map(idv=>{
                if(idv.online!==online) list.push(idv.id)
                idv.online=online;
                return this.db.add(idv,false)
            })
            return Promise.all(allTask).then(idvs=>{
                if(list.length){
                    log("update ",list);
                    this.db.commit();
                    this._sendUpdate("update",idvs)
                    return true
                }
                return false;
            })
        })
    }

    /**
     * send update to app
     * @param type type of update is "full device or just update"
     * @param devices devices information
     */
    private _sendUpdate(type:'full'|'update',devices:Device[]){
        const packet:PublishPacket={
            topic:_UPDATE_TOPIC_,
            payload:JSON.stringify({type,devices}),
            retain:true,
            qos:0,
            cmd:'publish',
            dup:false
        }
        this.network.publish(packet)
    }

    onUpdate(idvs:DeviceStatus[],client:any){
        const ids=idvs.map(s=>s.id);
        return this.db.gets(ids)
        .then(devices=>{
            const list:Device[]=[]
            idvs.forEach(idv=>{
                const dv=devices.find(d=>d.id==idv.id);
                if(!dv) return log("%s not exist on database",idv.id);
                console.log("\n+++ device.service.ts-80 +++",{dv:dv.status,idv:idv.status})
                if(dv.status!=idv.status){
                    dv.status=idv.status;
                    this.db.add(dv,false);
                    list.push(dv);
                    this.emit(dv.id+":"+dv.status,dv)
                }
            })
            log("update status:",list.map(l=>l.id));
            console.log("\n++++ device.service.ts-87\n",{idvs,list,ndevices:this.ndevices,devices})
            if(!list.length) return false;//update status
            this.db.commit();
            this._sendUpdate("update",list)
            return true;
        })
    }

    /** add unregister devices */
    private _addNewDevice(idvs:Device[]){
        const ids=idvs.map(i=>i.id)
        this.db.gets(ids).then(ndevices=>{
            idvs=idvs.filter(idv=>!ndevices.find(ndv=>ndv.id==idv.id));//not database
            console.log("\n+++ device.service.ts-99 idvs:",idvs);
            idvs.forEach(idv=>this.ndevices[idv.id]=idv)
        })
    }

    onConfigure(equipment:Equipment,devices:Device[],client:any){
        this._addNewDevice(devices)       
    }
}