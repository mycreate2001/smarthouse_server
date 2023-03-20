/** import */
import { WebSocket, WebSocketServer } from "ws";
import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import SocketService from "./socket_handle";


export default function startup(infor:ModulePackage,websocket:WebSocketServer){
    const log=createLog(infor.id,"center")
    //verify
    try{
        if(!websocket||!(websocket instanceof WebSocketServer)) throw new Error("load websocket error")
        const socket_handle=new SocketService(websocket);
        log("load success");
        return socket_handle
    }
    catch(err){
        const msg=err instanceof Error?err.message:'other error'
        log("### ERROR: %s",msg);
        return null;
    }
}
