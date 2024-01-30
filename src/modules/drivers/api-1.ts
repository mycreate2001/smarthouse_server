import { createLog } from "advance-log";
import { CommonDriverService, DeviceBasic, DeviceValueDataCommon } from "../../interface/device.interface";
import { DriverControl, DriverHook, DriverHookDb, DriverPacket } from "../../interface/device-service.interface";
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
        ref:'api/v1/infor',
        handler(client, packet, infor, driverService, network) {
            const replyTopic=infor.ref+"/res"
            const payload=packet.payload;
            if(payload==='devices'){
                driverService.getDevices()
                .then(devices=>network.publish(replyTopic,{devices,msg:"ok",err:0}))
                return;
            }
            if(payload==='ndevices'){
                network.publish(replyTopic,{ndevices:driverService.nDevices});
                log("new device ",driverService.nDevices);
            }
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