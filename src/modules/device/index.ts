import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import DeviceService from "./device.service";

export default function startDeviceService(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center");
    try{
        const mDatabases=modules.database
        if(!mDatabases||!mDatabases.length||!mDatabases[0].module){
            throw new Error("load database error");
        }
        const db=mDatabases[0].module;
        const service=new DeviceService(db);
        log("load success!");
        return service;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        log("### ERROR:%s\nmodules",modules);
        return null;
    }
}