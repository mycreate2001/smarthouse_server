import { AuthenticateError } from "aedes";
import { PublishPacket } from "packet"
import { UserData } from "../user/user.interfac";

export interface NetworkCommon{
    // on:NetworkOn;
    onPublish:NetworkHandlePublish;
    onConnect:NetworkOnConnect;
    publish:NetworkPublish;
    subscribe:NetworkSubscribe;
    authenticate:NetworkAuthenticate;
    authorizeSubscribe:NetworkAuthorizeSubscribe;
    authorizePublish:NetworkAuthorizePublish;
    _publish:NetworkPublish;
}

export type NetworkOn=(topic:"publish"|"subscribe"|"clientDisconnect"|"client",callback:NetworkCallback)=>void;
export type NetworkHandlePublish=(packet:PublishPacket,client:NetworkClient|null,server:NetworkCommon)=>void;
export type NetworkCallback=(packet:PublishPacket)=>void;
export type NetworkPublish=(packet:PublishPacket,callback?:NetworkCallbackError)=>void;
export type NetworkSubscribe=(topic:string,callback:NetworkCallback)=>any
/** handler new client connected */
export type NetworkOnConnect=(online:boolean,client:NetworkClient,network:NetworkCommon)=>void;
export type NetworkAuthenticate=(
    client:any,
    user:string,
    pass:Buffer|string,
    done:(err:AuthenticateError|null,success:boolean|null)=>void
)=>void

export interface NetworkClient{
    id:string;
    user?:UserData;
    publish:NetworkClientPublish;
}
export type NetworkCallbackError=(err?:Error)=>void;
export type NetworkAuthError=(error:Error|null,success:boolean|null)=>void;
export type NetworkAuthorizeSubscribe= (client:any,subscription:Subscription,callback:NetworkAuthSubscribeError)=>void;
export type NetworkAuthorizePublish=(client:any,packet:PublishPacket,callback:NetworkHandleError)=>void;

export type NetworkClientPublish=(packet:PublishPacket,callback:NetworkCallbackError)=>void;
export type NetworkAuthSubscribeError=(err:Error|null|undefined,subscription:Subscription)=>void;
export type NetworkHandleError=(err:Error|undefined|null)=>void;
export interface Subscription{
    topic:string;
    qos:Qos;
    retain:boolean;
}

export type Qos=0|1|2


///// ERROR CODE ////////
export interface ErrorCode{
    code:number|string;
    msg:string;
}