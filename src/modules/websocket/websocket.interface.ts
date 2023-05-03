import { NetworkClient } from "../network/network.interface";

export interface PublishPacket{
    cmd:"publish"|"subscribe"
    topic:string;
    payload:Buffer|string;
    retain?:boolean;
}

export interface AuthenticateHandle{
    (client:NetworkClient,user:string,pass:Buffer|string,callback:AuthErrorCallback):void
}


export interface AuthErrorCallback{
    (err:Error|null,success:boolean):void;
}
export interface ErrorHandle{
    (err:Error|null):void  //err=>reject,underfined=OK
}

/** subcribe */
export interface SubscribePacket{
    payload:SubscribePayload;
    topic:string;
    cmd?:string;
}

export type SubscribePayload=Subscription|Subscription[]|string|string[]
export interface Subscription{
    topic:string;
    qos:Qos;
    retain:boolean;
}

export type Qos=0|1|2

export type AuthorizeSubscribeHandle= (client:NetworkClient,subscription:Subscription,callback:AuthSubscribeError)=>void;
export type AuthSubscribeError=(err:Error|null|undefined,subscription:Subscription)=>void;
export type ServerSubscribeHandle=(packet:PublishPacket)=>void;

/** Publish */
export type AuthorizePublishHandle=(client:NetworkClient,packet:PublishPacket,callback:ErrorHandle)=>void; 