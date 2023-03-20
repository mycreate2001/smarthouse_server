import { WebSocket } from "ws";
import { PublishPacket, Subscription } from "../websocket/websocket.interface";



export interface SocketSavePacket{
    [topic:string]:{
        packet:PublishPacket|undefined|null
        subscribes:SocketSubscribePacket[]
    }
}

/** keep subscription on server */
export interface SocketSubscribePacket{
    ws:WebSocketExt;
    subscription:Subscription
}

export type SocketHandle=(ws:WebSocketExt,msg:PublishPacket,next?:Function)=>void;

export interface WebSocketExt extends WebSocket{
    id:string;
    uid?:string;
    token?:string;
}


/** keep subscription on server */
export interface SocketSubscribePacket{
    ws:WebSocketExt;
    subscription:Subscription
}