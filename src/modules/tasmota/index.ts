import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import { createLog } from "../../lib/log";
import { Client } from "client";
import { wildcard } from "../../lib/wildcard";
import Network from "../network/network";
import { AedesPublishPacket } from "packet";
import { Tasmota } from "./tasmota.handle";
export default function tamotas(infor:ModulePackage,modules:InputModule){
    const log=createLog("tasmota");
    // input & verify
    try{
        const mNetworks=modules.network;
        if(!mNetworks||!mNetworks.length||!mNetworks[0].module) 
            throw new Error("load network is failred")
        const mqtt=mNetworks[0].module
        const tasmota=new Tasmota(mqtt);
        return tasmota;
    }
    catch(err){
        const msg:string= err instanceof Error?err.message:"other error"
        log("### ERROR:%s",msg);
        return null;
    }
}



