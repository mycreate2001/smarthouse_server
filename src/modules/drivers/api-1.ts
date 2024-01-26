import { createLog } from "advance-log";
import { CommonDriverService, DeviceBasic, DeviceValueDataCommon } from "../../interface/device.interface";
import { DriverControl, DriverHook, DriverPacket } from "../../interface/device-service.interface";
const log=createLog("API V1",{enablePos:true})
const _TYPE='api-v1'
const _NETWORK_ID='mqtt';
const services:DriverHook[]=[
    {
        id:'get-new-devices',
        name:'get new devices',
        ref:'api/v1/ndevice/req',
        handler(client, packet, infor, driverService, network){
            // const ndevices=driverService.ndeVices;
            // network.publish('api1/ndevice/result',ndevices);
        },
    },
    {
        id:'add-device',
        name:'add device',
        ref:'api/v1/add-devcie/req',
        handler(client, packet, infor, driverService, network) {
            const {devices}=JSON.parse(packet.payload)
            driverService.adDevice(devices).then(list=>log("#update devices ",list))
        }
    },
    {
        id:'get-device',
        name:'get devices',
        ref:'api/v1/infor',
        handler(client, packet, infor, driverService, network) {
            const payload=packet.payload;
            if(payload==='devices'){
                driverService.getDevices()
                .then(devices=>network.publish(infor.ref+"/res",{devices,msg:"ok",err:0}))
            }
        }
    }
]
const control:DriverControl={}

////// main ////////////////////
export default function startup(inf:any):DriverPacket{
    return {services,control,type:_TYPE,networkId:_NETWORK_ID}
}

function getProperty(abc:object){
    const list=Object.getOwnPropertyNames(abc)
    console.log(list);
}

////////// interface ////////////////
interface CommonDriverServiceExt extends CommonDriverService{
    ndeVices:DeviceBasic[]
}