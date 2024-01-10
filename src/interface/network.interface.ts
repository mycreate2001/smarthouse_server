export const PUBLISH_TIMEOUT_SEC_DEFAULT=10;    // time for sending success to client
export interface GeneralNetwork{
    onConnect:GeneralNetworkConnect      // handle when network connection/disconnect
    // onMessage:GeneralOnMessage;             // handle when server get a new messager
    authenticate :GeneralAuthenticate;                  // handle login
    authorizePublish:GeneralAuthorizePublish;           // handle when get publish message from client
    authSubscribe:GeneralAuthorizeSubscribe;            // handle when new publish from client
    publish(topic:string,payload:object|string,opts?:Partial<Packet>):void;  // publish from server, it's pass throw the sercurity
}

type PublishPacket=Omit<Packet,"payload">

export interface GeneralClient{
    id:string;
}

/** Handle each function */
export type GeneralNetworkConnect=(client:GeneralClient,online:boolean)=>void;
export type GeneralOnMessage=(packet:Packet,client:GeneralClient)=>void;
export type GeneralAuthenticate =(client:GeneralClient,uid:string,pass:string,callback:GeneralHandleAuth)=>void;
export type GeneralAuthorizePublish=(client:GeneralClient,packet:Packet,callback:GeneralHandleAuthPub)=>void;
export type GeneralAuthorizeSubscribe =(client:GeneralClient,subs:Subscription|Subscription[],callback:GeneralHandleAuthSub)=>void;

export type GeneralHandleAuthPub=(err:any)=>void
export type GeneralHandleAuthSub=(err:any|null,sub?:Subscription|null|undefined)=>void;
export type GeneralHandleAuth=(error:any,sucess:boolean)=>void;
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
    onConnect:GeneralNetworkConnect;
}

export interface NetworkOptions{
    port:number
}