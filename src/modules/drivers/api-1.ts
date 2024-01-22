import { createLog } from "advance-log";
import { CommonDriverService, DeviceBasic, DeviceValueDataCommon } from "../../interface/device.interface";
import { DriverControl, DriverHook, DriverPacket } from "../../interface/driver.interface";
const log=createLog("API V1",{enablePos:true})
const _TYPE='api-v1'
const _NETWORK_ID='mqtt';
const services:DriverHook[]=[
    {
        id:'get-new-devices',
        name:'get new devices',
        ref:'api1/ndevice/req',
        handler(client, packet, infor, driverService, network){
            const ndevices=(driverService as CommonDriverServiceExt).ndeVices;
            network.publish('api1/ndevice/result',ndevices);
        },
    },
    {
        id:'test api',
        name:'test api',
        ref:'test/req',
        handler(client, packet, infor, driverService, network) {
            log("test ok");
            network.publish('test/res',"OK la")
        },
    }
]
const control:DriverControl={}

////// main ////////////////////
export default function startup(inf:any):DriverPacket{
    return {services,control,type:_TYPE,networkId:_NETWORK_ID}
}



////////// interface ////////////////
interface CommonDriverServiceExt extends CommonDriverService{
    ndeVices:DeviceBasic[]
}