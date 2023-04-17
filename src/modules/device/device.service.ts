import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import { PublishPacket } from "packet";
import tEvent from "../../lib/event";
import { createLog } from "advance-log";
import { wildcard } from "../../lib/wildcard";
import { NetworkClient, NetworkCommon } from "../network/network.interface";
import { ChangeData, Device, DeviceAdd, DeviceConfig, DeviceOnConnect, 
        DeviceDb, DeviceEdit, DeviceGetInfor, DeviceRemote, 
        DeviceServiceBase, DeviceUpdateBySearch, TopicData, TopicService, DeviceUpdate, DeviceDelete } from "./device.interface";
import { createPacket } from "../network/network.service";
import { getList, toArray } from "../../lib/utility";

const _DEVICE_DB_="devices"
const _UPDATE_TOPIC_="api/update"
const _DEVICE_EVENT="device"

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

    onConnect: DeviceOnConnect=(online,client)=>{
        log("\n++++ device.service.ts-52 +++ onConnect")
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

    remote: DeviceRemote=(idvs,network)=>{
        let outs:string[]=[]
        getList(idvs,"type").forEach(type=>{
            //collect some devices by 'type'
            const xdvs=idvs.filter(i=>i.type==type);
            if(!xdvs.length) return;
            const service=this.topicServices.find(t=>t.id==type&&t.type=='client');
            if(!service) {
                log("[remote] type '%s' no handler",type);
                throw new Error("Not service handle")
            }
            if(service.type=='client') {
                const result=service.remote(xdvs,network)
                outs=outs.concat(result)
            }
        })
        return outs;
    }

    /** handler update & add new device 
     * - update exist devices for new item
     * - add new devices
     * - No emitting any event when change
     * - send updateInfor to apps
     * - No checking deffirence points
    */
    edit: DeviceEdit = async(idvs) => {
        const ids = idvs.map(i => i.id)
        console.log("\n+++ device.service.ts-98 [edit] ids:",ids);
        return this.db.gets(ids).then(devices => {
            console.log("\n+++ device.service.ts-100 [edit] devices:",devices);
            const tasks:Promise<Device>[]=[];
            idvs.forEach(idv => {
                console.log("\n+++ device.service.ts-103 [edit] ",{idv});
                if(!idv.id) return log("[edit] ### device infor wrong")
                let dv = devices.find(d => d.id == idv.id);
                const ndevice=(dv)?Object.assign({},dv,idv): createDevice(idv)
                tasks.push(this.db.add(ndevice))
            })
            /** return result */
            return Promise.all(tasks).then(devices=>{
                this.sendUpdate("update",devices)
                if(devices.length) this.db.commit();
                return devices
            })
        })
    }

    // edit: DeviceEdit=(idvs,client)=>{
    //     return Promise.resolve([])
    // }

    delDevice: DeviceDelete=async (idvs)=>{
        const susList:string[]=[];
        const errList:string[]=[]
        toArray(idvs).forEach(idv=>{
            const id=typeof idv=='string'?idv:idv.id;
            if(!id) return log("[delDevice] wrong device infor\n\t\t\tdevice:",idv)
            const result=this.db.delete(idv);
            if(result) susList.push(id);
            else errList.push(id)
        })
        log("[delDevice] ",{success:susList,failured:errList});
        return susList;
    }

    updateBySearch: DeviceUpdateBySearch=(updates,client)=>{

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

    getInfor: DeviceGetInfor=(idvs)=>{
        //group device by type
        console.log("\n+++ [getInfor] device.service.ts-153 ++ ")
        const results=getList(idvs,"type").map(type=>{
            const tIdvs=idvs.filter(i=>i.type===type);
            const method=this.topicServices.find(t=>t.id===type);
            if(!method) return log("\n[getInfor] ###ERROR: No way to get infor\n");
            if(method.type=='client')
                return method.getInf(tIdvs,this.network);
        }).filter(x=>!!x)
        return results.length
    }


    /** update to devices & new devices */
    update: DeviceUpdate=(idvs,updatelist)=>{
        const _idvs=toArray(idvs);
        let _list:string[]
        const ids:string[]=idvs.map(idv=>idv.id).filter(x=>!!x);//get all id of devices
        this.db.gets(ids).then(devices=>{
            const updateDb:DeviceDb={}
            _idvs.forEach(idv=>{
                //verify
                if(!idv.id) return log("[update] ### ERROR! Device infor wrong");
                const device=devices.find(dv=>dv.id==idv.id);

                // Unregister device
                if(!device){
                    this.ndevices[idv.id]=Object.assign({},this.ndevices[idv.id],idv)
                    return;
                }

                //register device
                _list=updatelist||Object.keys(idv);
                _list.forEach(key=>{
                    const newVal=(idv as any)[key];
                    const oldVal=(device as any)[key];
                    if(newVal!==oldVal){
                        const change:ChangeData={key,newVal,oldVal}
                        if(device.updateList.includes(key.toLowerCase())){
                            this.emit(`${_DEVICE_EVENT}/${key}/${newVal}`,change)
                        }
                        (device as any)[key]=newVal;
                        updateDb[idv.id]=device;
                    }
                })
            }) //handle each device
            const updateDevices:Device[]=Object.keys(updateDb).map(key=>updateDb[key])
            log("[update] list:",updateDevices.map(u=>u.id))
            if(updateDevices.length){
                this.sendUpdate("update",updateDevices);
            }
            
        })// database
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




/////////// MINI FUNCTIONS //////////////

export const deviceDefault:Device={
    id:'',
    name:'',
    linkQuality:0,
    model:'',
    modelId:'',
    ipAddr:'',
    mac:'',
    fns:[],
    type:'',
    updateList:[],
    online:false

}
export function createDevice(idv:Partial<Device>):Device{
    return Object.assign({},deviceDefault,idv)
}

export type DeviceItem=keyof typeof deviceDefault;
