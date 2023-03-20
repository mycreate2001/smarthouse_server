import { ModulePackage } from "../../lib/module-loader/module.interface";
import { createLog } from "../../lib/log";
import { Tasmota } from "./tasmota.handle";
export default function tamotas(infor:ModulePackage,mqtt:any){
    const log=createLog(infor.id,"center");
    try{
        // input & verify
        if(!mqtt)throw new Error("load network is failred")
        const tasmota=new Tasmota(mqtt);
        log("load success!")
        return tasmota;
    }
    catch(err){
        log("### ERROR:%s\n",err instanceof Error?err.message:"other error");
        return null;
    }
}



