/** import */
import { WebSocketServer } from "ws";
import { ModulePackage } from "../../lib/module/module.interface";
import SocketService from "./socket_handle";


export default function startup(infor:ModulePackage,modules:ModulePackage[]){
    // const socketModule=modules.find(m=>m.type=='input' && m.targets.includes(infor.id));
    // if(!socketModule) return ;
    // const socket=socketModule.module
    // const service=new SocketService(socket);
    // return service
        //

    const module= modules.find(m=>m.type=='network' && m.module instanceof WebSocketServer)
    if(!module) return null;
    const service=new SocketService(module.module);
    return service;
}
