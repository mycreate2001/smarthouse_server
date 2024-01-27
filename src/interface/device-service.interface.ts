import { CommonDriverService, deviceValueDefault } from "./device.interface";
import { CommonClient, CommonNetwork, Packet } from "./network.interface";


/** handle each topic */
export interface DriverHook{
    id:string;
    name?:string;    // name of driver
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
    networkIds:string[];             // network type
}
type RemoteFunction= keyof typeof deviceValueDefault
export interface DriverControl{
    [id:RemoteFunction]:Function
}