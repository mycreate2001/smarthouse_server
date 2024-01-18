import { UserDataExt } from "./user.interface";

export const PUBLISH_TIMEOUT_SEC_DEFAULT=10;    // time for sending success to client
export interface CommonNetwork{
    onConnect:CommonNetworkConnect      // handle when network connection/disconnect
    // onMessage:CommonOnMessage;             // handle when server get a new messager
    authenticate :CommonAuthenticate;                  // handle login
    authorizePublish:CommonAuthorizePublish;           // handle when get publish message from client
    authSubscribe:CommonAuthorizeSubscribe;            // handle when new publish from client
    publish(topic:string,payload:object|string,opts?:Partial<Packet>):void;  // publish from server, it's pass throw the sercurity
    // _subscribe(client:CommonClient,sub:Subscription[]|Subscription):void
    on(title:string,callback:(client:CommonClient,...data:any[])=>void):void;
    once(title:string,callback:(client:CommonClient,...data:any[])=>void):void;
}

export interface CommonClient{
    id:string;
    eid?:string;
    user?:UserDataExt
}

/** Handle each function */
export type CommonNetworkConnect=(client:CommonClient,online:boolean)=>void;
export type CommonOnMessage=(packet:Packet,client:CommonClient)=>void;
export type CommonAuthenticate =(client:CommonClient,uid:string,pass:string,callback:CommonHandleAuth)=>void;
export type CommonAuthorizePublish=(client:CommonClient,packet:Packet,callback:CommonHandleAuthPub)=>void;
export type CommonAuthorizeSubscribe =(client:CommonClient,subs:Subscription,callback:CommonHandleAuthSub)=>void;

export type CommonHandleAuthPub=(err:any)=>void
export type CommonHandleAuthSub=(err:any|null,sub:SubscripStd|undefined)=>void;
export type CommonHandleAuth=(error:any,sucess:boolean)=>void;
export interface PublishOption{
    timeout_sec:number;
}
export interface Packet{
    topic:string;           // topic of message
    payload:string;         // content of message
    qos:Qos;                // type of sending
    retain:boolean;         // enable remain message for new connect or not True= Remember this message
    cmd:string;
}

export const PacketDefault:Packet={
    topic:'',
    payload:'',
    qos:0,
    retain:false,
    cmd:'publish'
}

export function createPacket(opts:Partial<Packet>={}):Packet{
    return Object.assign({},PacketDefault,opts)
}

export type Subscription=SubscripStd|string
export interface SubscripStd{
    topic:string;
    qos:Qos;
}
export type Qos=0|1|2

export declare class Network{
    port:number;
    constructor(opts?:Partial<NetworkOptions>);
    onConnect:CommonNetworkConnect;
}

export interface NetworkOptions{
    port:number
}


//////// functions ////////////
export function correctSubsciption(sub:Subscription):SubscripStd{
    return typeof sub==='string'?{topic:sub,qos:0}:sub
}