import LocalDatabaseLite, { DataConnect, toArray } from "local-database-lite";
import { PublishPacket } from "packet";
import tEvent from "../../lib/event";
import { createLog } from "../../lib/log";
import { wildcard } from "../../lib/wildcard";
import { Networkclient, NetworkCommon } from "../network/network.interface";
import { Device, DeviceAdd, DeviceConfig, DeviceConnect, 
        DeviceDb, DeviceEdit, DeviceGetInfor, DeviceRemote, 
        DeviceRoute, DeviceServiceBase, DeviceUpdateByNetworkId, Equipment } from "./device.interface";

const _DEVICE_DB_="devices"
const _UPDATE_TOPIC_="api/update"
const log=createLog("DeviceService","center")

export default class DeviceService extends tEvent implements DeviceServiceBase{
    db:DataConnect<Device>;
    network:NetworkCommon;
    ndevices:DeviceDb={};
    deviceRoutes:DeviceRoute[]=[]
    constructor(network:NetworkCommon,db:LocalDatabaseLite,deviceRoutes:DeviceRoute[]){
        super();
        this.db=db.connect(_DEVICE_DB_);
        this.network=network
        this.deviceRoutes=deviceRoutes;
        network.onConnect=(online,client,server)=>{
            this.onConnect(online,client)
        }

        network.onPublish=(packet,client,server)=>{
            const _client:Networkclient=client?client:{id:"server"}
            if(!this._dispatch(packet,_client)){
                const user=_client.user||{id:"root"}
                log("%d (%s) publish %s \npayload:%s",_client.id,user.id,packet.topic,packet.payload.toString())
            }
        }
    
        // console.log("\n\n++++ device.service.ts-33 ",{Routes:this.deviceRoutes,network});

    }

     /** send update to app */
     update(type:'full'|'update',devices:Device[]){
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
            if(!devices.length) return log("[onconnect] NOT CHANGE")
            Promise.all(all).then(_=>{
                this.db.commit();
                this.update("update",devices);
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
                const dv = devices.find(d => d.id == idv.id);
                if (!dv)  return log("### '%s' is unregister device", idv.id);
                Object.assign(dv, idv);
                //check different
                updateList.push(dv);
                const result=this.db.add(dv,false);
                all.push(result)
            })
            if(!updateList.length) return log("[onEdit] Nothing change")
            Promise.all(all).then(_=>{
                this.update("update",updateList)
                this.db.commit();
            })
        })
    }

    updateByNetworkId: DeviceUpdateByNetworkId=(idvs,client)=>{
        const networkId=idvs.networkId;
        this.db.search({key:'networkId',type:'==',value:networkId})
        .then(devices=>{
            devices.forEach(dv=>{
                console.log("\n++++ device.service.ts ++++ ",dv);
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
                this.update("update",nIdvs);
            })
        })
    }

    private _dispatch(packet:PublishPacket,client:Networkclient){
        try{
            const beCalls=this.deviceRoutes.filter(handle=>!!handle.handle && wildcard(packet.topic,handle.ref))
            beCalls.forEach(handle=>handle.handle(packet,client,this))
            return beCalls.length;
        }
        catch(err){
            const msg:string=err instanceof Error?err.message:"other error"
            log("dispatch ### ERROR:%s",msg);
            return 0;
        }
    }


}

export function getEquipment(payload:string,networkId:string):Equipment{
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
        online:true,
        networkId
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
            status:0,
            model:equipment.model,
            networkId:equipment.networkId
        })
    })
    return devices
}