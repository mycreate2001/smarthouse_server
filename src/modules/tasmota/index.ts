import { ModulePackage } from "../../lib/module-loader/module.interface";
import { createLog } from "../../lib/log";
import { Tasmota } from "./tasmota.service";
export default function tamotas(infor:ModulePackage,mqtt:any){
    // 1. input & verify
    if(!mqtt)throw new Error("load network is failred")

    /** 2. execute */
    const tasmota=new Tasmota(mqtt);
    return tasmota;
}



