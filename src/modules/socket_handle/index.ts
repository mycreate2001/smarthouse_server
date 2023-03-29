/** import */
import { WebSocketServer } from "ws";
import { ModulePackage } from "../../lib/module-loader/module.interface";
import SocketService from "./socket.service";


export default function startup(infor:ModulePackage,websocket:WebSocketServer){
    //1. input & verify
    if(!websocket||!(websocket instanceof WebSocketServer)) throw new Error("load websocket error")
    // 2. execute
    const socket_handle=new SocketService(websocket);
    return socket_handle
}
