import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import { createLog } from "../../lib/log";
import { Client } from "client";
import { wildcard } from "../../lib/wildcard";
import Network from "../network/network";
import handles, { ObjectPacket } from "./tasmota.handle";
import { AedesPublishPacket } from "packet";
export default function tamotas(infor:ModulePackage,modules:InputModule){
    const log=createLog("tasmota");
    // input & verify
    const networkModules=modules.network;
    if(!networkModules||!networkModules.length||!networkModules[0].module){
        log("load network was failred!\n\t\t",modules);
        return null;
    }
    const network=networkModules[0].module;
    network.on("publish",(packet:AedesPublishPacket,client:any)=>{
        if(packet.cmd!=='publish') return;
        dispath(packet,client,network)
    })
    return 1
}
const log=createLog("handle","center")


function dispath(packet:AedesPublishPacket,client:Client,server:Network){
    const topic=packet.topic;
    try{
        const payload=JSON.parse(packet.payload.toString())
        const _packet:ObjectPacket={...packet,payload}
        const result=handles.some(handle=>{
            if(!wildcard(topic,handle.topic)) return;
            handle.handle(_packet,client,server)
            return true;
        })
        if(!result){
            log("message is not yet handle\n",_packet)
        }
    }
    catch(err){}
}


