// import { NetworkClient } from "../network/network.interface";

export interface PublishPacket{
    cmd:"publish"|"subscribe"
    topic:string;
    payload:Buffer|string;
    retain?:boolean;
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