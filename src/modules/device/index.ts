import { createLog } from "../../lib/log";
import { ModulePackage } from "../../lib/module-loader/module.interface";
import Network from "../network/network";
import DeviceService from "./device.service";

export default function startDeviceService(infor:ModulePackage,db:any,network:Network){
    const log=createLog(infor.id,"center");
    try{
        /** input & verify */
        if(!db)throw new Error("load database error");
        if(!network) throw new Error("load network error")
        const service=new DeviceService(db);
        console.log("\n++++ device.index.ts \nnetwork:",network);
        network.onConnect=service.onConnect;
        network.onUpdate=service.onUpdate;
        network.onConfigure=service.onConfigure;
        network.update();
        log("load success!");
        return service;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        log("### ERROR:%s\n");
        return null;
    }
}