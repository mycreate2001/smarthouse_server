import LocalDatabaseLite, { DataConnect, LocalDatabaseQuery, toArray } from "local-database-lite";
import { PublishPacket } from "packet";
import tEvent from "../../lib/event";
import { createLog } from "advance-log";
import { wildcard } from "../../lib/wildcard";
import { NetworkClient, NetworkCommon } from "../network/network.interface";
import { Device, DeviceAdd, DeviceConfig, DeviceConnect, 
        DeviceDb, DeviceEdit, DeviceGetInfor, DeviceOnUpdate, DeviceRemote, 
        DeviceServiceBase, DeviceUpdateBySearch, TopicData, TopicService, TopicServiceClient, TopicServiceDb } from "./device.interface";
import { createPacket } from "../network/network.service";
import { getList } from "../../lib/utility";

const _DEVICE_DB_="devices"
const _UPDATE_TOPIC_="api/update"
const log=createLog("DeviceService","center")

export default class DeviceService extends tEvent implements DeviceServiceBase{
    db:DataConnect<Device>;
    network:NetworkCommon;
    ndevices:DeviceDb={};
    topicServices:TopicService[]=[];
    constructor(network:NetworkCommon,db:LocalDatabaseLite,topicServices:TopicService[]){
        super();
        this.db=db.connect(_DEVICE_DB_);
        this.network=network
        /** services */
        // console.log('\n+++ device.service.ts-25 ',topicServices);
        topicServices.forEach(service=>{
            const id=service.id
            if(!id) log("\n#ERROR(1): service is empty id")
            const pos=this.topicServices.findIndex(t=>t.id==service.id);
            if(pos==-1) this.topicServices.push(service);
            else this.topicServices[pos]=service;
        })

        network.onConnect=(online,client,network)=>{
            this.onConnect(online,client)
        }

        network.onPublish=(packet,client,network)=>{
            const _client:NetworkClient=client?client:{id:"server",publish:(packet,cb)=>null}
            // log("\n\n#%d publish %s \npayload:%s",_client.id,packet.topic,packet.payload.toString())
            this._dispatch(packet,_client)
        }
    

    }

    /** send update to app */
    sendUpdate(type: 'full' | 'update', devices: Device[]) {
        const packet=createPacket({payload:{type,devices},topic:_UPDATE_TOPIC_})
        this.network.publish(packet)
    }

    /* `publish` is a method that takes a `PublishPacket` object as an argument and publishes it to the
    network using the `network.publish` method. If there is an error during the publishing process,
    it logs the error message using the `log` function. */
    publish= (packet: PublishPacket) => {
        this.network.publish(packet,(err)=>{
            if(err) log("## [publish] %s =>failed, err:",packet.topic,err.message)
        })
    }

    /** remote device from server */
    remote: DeviceRemote=(idvs,network)=>{
        getList(idvs,"type").forEach(type=>{
            //collect some devices by 'type'
            const xdvs=idvs.filter(i=>i.type==type);
            if(!xdvs.length) return;
            const service=this.topicServices.find(t=>t.id==type&&t.type=='client');
            if(!service) return log("[remote] type '%s' no handler",type);
            if(service.type=='client') service.remote(xdvs,network)
        })
    }

    /* The `onConnect` function is a method that handles the event when a device connects to the
    network. It takes two parameters: `online` (a boolean indicating whether the device is online or
    not) and `client` (a `NetworkClient` object representing the device that has connected). */
    onConnect: DeviceConnect=(online,client:NetworkClient)=>{
        this.db.search({key:'eid',type:'==',value:client.id})
        .then(devices=>{
            const all=devices.map(dv=>{
                dv.online=online;
                return this.db.add(dv,false);
            })
            /** result */
            /** @@@ test */
            // this.getInfor(devices,this.network)
            // this.remote(devices,this.network);
            const topic=`cmnd/${client.id}/Power`
            const payload="OFF"
            const packet=createPacket({payload,topic})
            // client.publish(createPacket({payload,topic}),()=>console.log("\n+++ device.service.ts-92 +++"))
            this.network.publish(packet)
            /** @@@ test end */
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

    getInfor: DeviceGetInfor=(idvs,network)=>{
        //group device by type
        console.log("\n+++ [getInfor] device.service.ts-153 ++ ")
        const results=getList(idvs,"type").map(type=>{
            const tIdvs=idvs.filter(i=>i.type===type);
            const method=this.topicServices.find(t=>t.id===type);
            if(!method) return log("\n[getInfor] ###ERROR: No way to get infor\n");
            if(method.type=='client')
                return method.getInf(tIdvs,network);
        }).filter(x=>!!x)
        return results.length
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

    private _dispatch(packet:PublishPacket,client:NetworkClient):number{

        try{
            const topic=packet.topic
            /** get topic data */
            const results=this.topicServices.reduce((acc:any[],cur:TopicService)=>{
                return [...acc,...cur.topics]
            },[])
            /** execute */
            .map((handle:TopicData)=>{
                // console.log("\n+++ device.service.ts-196 +++\nhandle:",handle,"\ntopic:",topic);
                // console.log("\n+++ device.service.ts-197 +++\nref:",handle.ref);
                if(!wildcard(topic,handle.ref)) return;
                handle.handle(packet,client,this.network,this);
                return true;
            })
            .filter(x=>!!x);//filter result
            return results.length;
        }
        catch(err){
            log("\n[_dispath] ### ERROR: ",err);
            console.log("\n+++ DEBUG/device.service.ts-207 +++ \n",{topic:packet.topic,client:client.id},"\n-----------------------\n\n")
            return 0;
        }
    }


}
