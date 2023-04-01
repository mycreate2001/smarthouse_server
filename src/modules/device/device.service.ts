import LocalDatabaseLite, { DataConnect, LocalDatabaseQuery, toArray } from "local-database-lite";
import { PublishPacket } from "packet";
import tEvent from "../../lib/event";
import { createLog } from "advance-log";
import { wildcard } from "../../lib/wildcard";
import { Networkclient, NetworkCommon } from "../network/network.interface";
import { Device, DeviceAdd, DeviceConfig, DeviceConnect, 
        DeviceDb, DeviceEdit, DeviceGetInfor, DeviceOnUpdate, DeviceRemote, 
        DeviceServiceBase, DeviceUpdateBySearch, TopicService, TopicServiceDb } from "./device.interface";

const _DEVICE_DB_="devices"
const _UPDATE_TOPIC_="api/update"
const log=createLog("DeviceService","center")

export default class DeviceService extends tEvent implements DeviceServiceBase{
    db:DataConnect<Device>;
    network:NetworkCommon;
    ndevices:DeviceDb={};
    topicServices:TopicServiceDb={};
    constructor(network:NetworkCommon,db:LocalDatabaseLite,topicServices:TopicService[]){
        super();
        this.db=db.connect(_DEVICE_DB_);
        this.network=network
        /** services */
        // console.log('\n+++ device.service.ts-25 ',topicServices);
        topicServices.forEach(service=>{
            const id=service.id
            if(!id) log("\n#ERROR(1): service %s is error",service.name||"unname")
            this.topicServices[id]=service;
        })

        network.onConnect=(online,client,server)=>{
            this.onConnect(online,client)
        }

        network.onPublish=(packet,client,server)=>{
            const _client:Networkclient=client?client:{id:"server"}
            // log("\n\n#%d publish %s \npayload:%s",_client.id,packet.topic,packet.payload.toString())
            this._dispatch(packet,_client,server)
        }
    

    }

     /** send update to app */
     sendUpdate(type:'full'|'update',devices:Device[]){
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

    publish= (packet: PublishPacket) => {
        this.network.publish(packet,(err)=>{
            if(err) log("## [publish] %s =>failed, err:",packet.topic,err.message)
        })
    }

    /** remote device from server */
    remote: DeviceRemote=(stts)=>{

    }

    /** handle device connect/disconnect event */
    onConnect: DeviceConnect=(online,client)=>{
        const eid=client.id;
        this.db.search({key:'eid',type:'==',value:client.id})
        .then(devices=>{
            const all=devices.map(dv=>{
                dv.online=online;
                return this.db.add(dv,false);
            })
            const packet:PublishPacket={
                topic:`cmnd/${eid}/zbinfo`,
                cmd:'publish',
                retain:false,
                dup:false,
                qos:0,
                payload:''
            }
            this.publish(packet);
            if(!devices.length) return log("[onconnect] NOT CHANGE")
            Promise.all(all).then(_=>{
                this.db.commit();
                this.sendUpdate("update",devices);
            })
        })
    }

    /** handle event edit device */
    onEdit: DeviceEdit = (idvs, client) => {
        const ids = idvs.map(i => i.id)
        this.db.gets(ids).then(devices => {
            const updateList: Device[] = []
            const all:Promise<Device>[]=[]
            idvs.forEach(idv => {
                let dv = devices.find(d => d.id == idv.id);
                if (!dv)  return log("### '%s' is unregister device", idv.id);
                dv=Object.assign(dv, idv);
                //check different
                updateList.push(dv);
                const result=this.db.add(dv,false);
                all.push(result)
            })
            if(!updateList.length) return log("[onEdit] Nothing change")
            Promise.all(all).then(_=>{
                this.sendUpdate("update",updateList)
                this.db.commit();
            })
        })
        /** new device */
        idvs.forEach(idv=>{
            let ndevice=this.ndevices[idv.id];
            if(!ndevice) return;
            ndevice=Object.assign(ndevice,idv);
            this.ndevices[idv.id]=ndevice;
            log("#device.service.ts-119 ",{ndevice})
        })
    }

    updateBySearch: DeviceUpdateBySearch=(keys,idvs:any[],client)=>{
        const _keys=toArray(keys);
        idvs.forEach(idv=>{
            const queries:LocalDatabaseQuery[]=_keys.map(key=>{
                return {key,type:'==',value:idv[key]}
            })
            this.db.search(...queries).then(devices=>{
                log("#### debug ",devices)
            })
        })
    }

    /** handle event new device -->ndevice */
    onConfigure: DeviceConfig=(idvs,client)=>{
        const ids=idvs.map(i=>i.id);
        this.db.gets(ids).then(devices=>{
            idvs.forEach(idv=>{
                const dv=devices.find(d=>d.id===idv.id);
                if(dv) return //exist device
                //new device
                this.ndevices[idv.id]=idv;
            })
        })
    }

    getInfor: DeviceGetInfor=(deviceId,client)=>{

    }

    onUpdate: DeviceOnUpdate=(idvs)=>{

    }

    add: DeviceAdd=(idvs)=>{
        const ids=idvs.map(i=>i.id);
        this.db.gets(ids).then(devices=>{
            const nIdvs=idvs.filter(idv=>devices.some(dv=>dv.id==idv.id));//new devices
            //const eIdvs=idvs.filter(idv=>!devices.some(dv=>dv.id==idv.id))  //exist devices
            const all=nIdvs.map(idv=>this.db.add(idv,false));
            if(!all.length) return log("NOTHING UPDATE");
            Promise.all(all).then(_=>{
                this.db.commit();
                log("[add] update ",nIdvs.map(n=>n.id));
                this.sendUpdate("update",nIdvs);
            })
        })
    }

    private _dispatch(packet:PublishPacket,client:Networkclient,server:NetworkCommon):number{
        try{
            const topic=packet.topic;
            const results=Object.keys(this.topicServices).map(id=>{
                const handle=this.topicServices[id];
                if(wildcard(topic,handle.ref)) {
                    handle.handle(packet,client,server,this);
                    return true;
                }
                return false;

            }).filter(x=>!!x)
            return results.length
        }
        catch(err){
            const msg:string=err instanceof Error?err.message:"other error"
            log("dispatch ### ERROR:%s",msg);
            return 0;
        }
    }


}
