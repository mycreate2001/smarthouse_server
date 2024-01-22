import { DeviceServiceData } from "../modules/device/service";
import { CommonDriverService } from "./device.interface";
import { CommonClient, Packet } from "./network.interface";


/** handle each topic */
export interface DriverHook{
    id:string;
    name:string;    // name of driver
    ref:string;     // path of driver
    handler:( 
                client:CommonClient,    // client
                packet:Packet,          // packet data
                infor:DriverHook,       // hook driver
                driverService:CommonDriverService|DeviceServiceData   //driver service
            )=>any
}

export interface DriverPacket{
    services:DriverHook[];
    control:DriverControl;
    type:string;
}

export interface DriverControl{
   [id:string]:Function;
}