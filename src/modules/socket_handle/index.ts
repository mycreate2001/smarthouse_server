/** import */
import { WebSocketServer } from "ws";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import SocketService from "./socket_handle";


export default function startup(infor:ModulePackage,modules:InputModule){
    // console.log("\n++++ %s +++\nmodules:",infor.name,modules)
    const socketModule=modules.websocket[0];
    if(!socketModule) return null;
    const socket=new SocketService(socketModule.module);
    return socket
}
