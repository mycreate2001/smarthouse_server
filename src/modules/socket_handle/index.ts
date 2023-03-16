/** import */
import { WebSocketServer } from "ws";
import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import SocketService from "./socket_handle";


export default function startup(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center")
    //verify
    const socketModule=modules.websocket;
    if(!socketModule||!socketModule.length||!socketModule[0].module){
        log("load websocket error");
        return null;
    }

    //execute
    const websocket=socketModule[0].module;
    const socket_handle=new SocketService(websocket);
    log("load success");
    return socket_handle
}
