/** import */
import { WebSocketServer } from "ws";
// import { ModulePackage } from "../../lib/module-loader/module.interface";
import SocketService from "./socket.service";
import { CommonNetworkPacket } from "../../interface/network.interface";
import { ModulePackage } from "module-loader/interface";

const _NETWORK_ID="websocket"

export default function startup(infor:ModulePackage,websocket:WebSocketServer):CommonNetworkPacket{
    //1. input & verify
    if(!websocket||!(websocket instanceof WebSocketServer)) throw new Error("load websocket error")
    const id:string=infor.params.networkId||_NETWORK_ID;
    // 2. execute
    const service=new SocketService(websocket);
    return {service,id}
}
