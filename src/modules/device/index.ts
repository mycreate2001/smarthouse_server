import { ModulePackage } from "../../lib/module-loader/module.interface";

import DeviceService from "./device.service";

export default function startDeviceService(infor:ModulePackage,network:any,db:any,services:any[]){
   //1. input & verify
    if(!db)throw new Error("load database error");
    if(!network) throw new Error("load network error")
    if(!services) throw new Error("topic services error");
    //2. execute
    let _services:any[]=[]
    services.forEach(service=>{
        _services=_services.concat(service)
    })
    console.log("\n+++ device.index.ts-15 +++ _services:",_services)
    const service=new DeviceService(network,db,_services);
    return service; /** success */
}