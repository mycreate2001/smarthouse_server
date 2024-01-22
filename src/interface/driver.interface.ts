import { CommonDriverService } from "./device.interface";
import { CommonClient, CommonNetwork, Packet } from "./network.interface";


/** handle each topic */
export interface DriverHook{
    id:string;
    name:string;    // name of driver
    ref:string;     // path of driver
    handler:( 
                client:CommonClient,                    // client
                packet:Packet,                          // packet data
                infor:DriverHook,                       // hook driver
                driverService:CommonDriverService,      // driver service
                network:CommonNetwork                   // network
            )=>any
}

export interface DriverPacket{
    services:DriverHook[];
    control:DriverControl;
    type:string;
    networkId:string;             // network type
}

export interface DriverControl{
   [id:string]:Function;
}