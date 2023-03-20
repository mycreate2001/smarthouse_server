import { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import { ModulePackage } from "../../lib/module-loader/module.interface";
import { Device } from "./device.interface";
import DeviceService from "./device.service";

export default function startDeviceService(infor:ModulePackage,db:DataConnect<Device>){
    const log=createLog(infor.id,"center");
    try{
        /** input & verify */
        if(!db)throw new Error("load database error");
        const service=new DeviceService(db);
        log("load success!");
        return service;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        log("### ERROR:%s\n");
        return null;
    }
}