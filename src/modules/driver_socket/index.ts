import { createDebug } from "advance-log";
import { _DB_DEVICE } from "../../interface/device.interface";
import { DriverControl, DriverHook, DriverPacket } from "../../interface/driver.interface";

const _LABEL="ws driver"
const debug=createDebug(_LABEL,1)

export const services:DriverHook[]=[
    {
        id:'connect',
        ref:'device/:eid/connect',
        name:"connect",
        handler(client, packet, infor, driverService) {
            debug(1,"OK")
        },
    }
]


////////// CONTROLS ////////////////////
const control:DriverControl={
    status(id:string,status:number){

    }
}
////////////////// MAIN /////////////////////////////
export default function startup(inf:any):DriverPacket{
    return {services,type:'websocket',control}
}