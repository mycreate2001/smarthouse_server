import { createLog } from "advance-log";
import { CommonDriverService, DeviceBasic, DeviceValueDataCommon } from "../../interface/device.interface";
import { DriverControl, DriverHook, DriverHookDb, DriverPacket } from "../../interface/device-service.interface";
import { createPacket } from "../../interface/network.interface";
import { toArray } from "ultility-tools";
const log=createLog("API V1",{enablePos:true})
const _TYPE='api-v1'
const _NETWORK_ID='mqtt,websocket'.split(",");
const services:DriverHookDb={
    getNewDevices:{
        type:'get-new-devices',
        name:'get new devices',
        ref:'api/v1/ndevice/req',
        handler(client, packet, infor, driverService, network){
            // const ndevices=driverService.ndeVices;
            // network.publish('api1/ndevice/result',ndevices);
        },
    },
    register:{
        type:'register',
        name:'register device',
        ref:'api/v1/register',
        handler(client, packet, infor, driverService, network) {
            const {devices}=JSON.parse(packet.payload)
            driverService.register(devices).then(list=>log("#update devices ",list))
        }
    },
    getDevice:{
        type:'get-device',
        name:'get devices',
        ref:'api/v1/:id/infor',
        handler(client, packet, infor, driverService, network) {
            const replyTopic=infor.ref.replace(":id",client.id)+"/res"
            const payload=packet.payload;
            const reqs=payload.split(" ");
            const pTasks=reqs.map( async req=>{
                if(req==='ndevices') return {data:driverService.nDevices,req}
                if(req==='devices') return {data:await driverService.getDevices(),req};
                //other case
                return;
            }).filter(x=>!!x);

            Promise.all(pTasks).then(objs=>{
                // log("### TEST-001 ### ",{obj:JSON.stringify(objs)})
                const results:any={}
                toArray(objs).forEach(obj=>{
                    if(!obj) return
                    results[obj.req]=obj.data
                })
                network.publish(replyTopic,JSON.stringify({...results,error:0}))
            })
            .catch(err=>{
                const msg:string=err instanceof Error?err.message:"other"
                network.publish(replyTopic,JSON.stringify({error:1,msg}))
            })
        }
    },
    remote: {
        type:'remote',
        name:'remote control',
        ref:'api/:eid/remote',
        handler(client, packet, infor, driverService, network) {
            try{
                const _payload=typeof packet.payload=="string"?JSON.parse(packet.payload):packet.payload;
                const idvs=_payload.devices;
                log("remote/test-001",{idvs});
                driverService.remote(idvs,network);
            }
            catch(err){
                log("remote error\n",err);
                // network.publish()
            }
        },
    }
}
const control:DriverControl={}

////// main ////////////////////
export default function startup(inf:any):DriverPacket{
    return {services,control,type:_TYPE,networkIds:_NETWORK_ID}
}

function getProperty(abc:object){
    const list=Object.getOwnPropertyNames(abc)
    console.log(list);
}

////////// interface ////////////////
interface CommonDriverServiceExt extends CommonDriverService{
    ndeVices:DeviceBasic[]
}