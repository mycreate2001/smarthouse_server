import { CommonClient, CommonNetwork, Packet } from "./network.interface";

export interface DriverServiceData{
    [id:string]:DriverData
}

export interface DriverData{
    name:string;    // name of driver
    ref:string;     // path of driver
    handler:(client:CommonClient,packet:Packet,server:CommonNetwork,ref:string)=>any
}

export interface DriverDataExt extends DriverData{
    id:string;
}

export function intDriver(handlers:DriverServiceData,server:CommonNetwork){
    Object.keys(handlers).forEach(id=>{
        const handle={id,...handlers[id]};
        server.on(handle.ref,(client,packet)=>{
            handle.handler(client,packet,server,handle.ref)
        })
    })
}