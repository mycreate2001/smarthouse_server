import { PublishPacket } from "packet"

export interface NetworkCommon{
    on:NetworkOn;
    onPublish:NetworkOnPublish;
    publish:NetworkPublish;
    subscribe:NetworkSubscribe;
    onConnect:NetworkOnConnect;
    authenticate:NetworkAuthenticate;
    authorizeSubscribe:NetworkAuthorizeSubscribe;
    authorizePublish:NetworkAuthorizePublish;
}

export type NetworkOn=(topic:"publish"|"subscribe",callback:NetworkCallback)=>void;
export type NetworkOnPublish=(packet:PublishPacket,client:Networkclient,server:NetworkCommon)=>void;
export type NetworkCallback=(packet:PublishPacket)=>void;
export type NetworkPublish=(packet:PublishPacket,callback?:NetworkCallbackError)=>void;
export type NetworkSubscribe=(topic:string,callback:NetworkCallback)=>void
export type NetworkOnConnect=(stt:boolean,client:Networkclient,server:NetworkCommon)=>void;
export type NetworkAuthenticate=(client:any,user:string,pass:Buffer|string,callback:NetworkAuthError)=>void

export type Networkclient=object&{id:string}
export type NetworkCallbackError=(err:Error|undefined)=>void;
export type NetworkAuthError=(err:Error|null,success:boolean)=>void;
export type NetworkAuthorizeSubscribe= (client:any,subscription:Subscription,callback:NetworkAuthSubscribeError)=>void;
export type NetworkAuthorizePublish=(client:any,packet:PublishPacket,callback:NetworkHandleError)=>void;

export type NetworkAuthSubscribeError=(err:Error|null|undefined,subscription:Subscription)=>void;
export type NetworkHandleError=(err:Error|undefined|null)=>void;
export interface Subscription{
    topic:string;
    qos:Qos;
    retain:boolean;
}

export type Qos=0|1|2