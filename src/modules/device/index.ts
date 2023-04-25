import { ModulePackage } from "../../lib/module-loader/module.interface";

import DeviceService from "./device.service";

export default function startDeviceService(infor:ModulePackage,network:any,db:any,services:any[],userService:any){
   //1. input & verify
    if(!db)throw new Error("load database error");
    if(!network) throw new Error("load network error")
    if(!services) throw new Error("topic services error");
    //2. execute
    let _services:any[]=[]
    services.forEach(service=>{
        _services=_services.concat(service)
    })
    const service=new DeviceService(network,db,_services,userService);
    return service; /** success */
}