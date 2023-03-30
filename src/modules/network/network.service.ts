import { createLog } from "advance-log";
import { NetworkAuthenticate, NetworkAuthorizePublish, NetworkAuthorizeSubscribe, 
         NetworkCommon, NetworkHandlePublish, NetworkOnConnect, 
         NetworkPublish, NetworkSubscribe } from "./network.interface";
const log=createLog("Network","center");
export default class Network implements NetworkCommon{
    servers:NetworkCommon[]=[]
    constructor(...servers:NetworkCommon[]){
        this.servers=servers;
        servers.forEach(server=>{
            // server.on=this.on;
            server.onPublish=(packet,client,server )=>this.onPublish(packet,client,this);
            server.onConnect=(stt,client,server)=> this.onConnect(stt,client,this);
            server.publish=(packet,callback)=>this.publish(packet,callback);
            server.subscribe=this.subscribe;
        })
    }

    onPublish: NetworkHandlePublish=(packet,client,server)=>{
        log("[publish] ### NOT BE HANDLE");
    }

    onConnect: NetworkOnConnect=(stt,client,server)=>{
        log("[connect] ### NOT BE HANDLE");
    }

    publish: NetworkPublish=(packet,callback)=>{
        log("publish %s :%s",packet.topic,packet.payload)
        return this.servers.map(server=>server._publish(packet,callback))
    }

    _publish: NetworkPublish=(packet,callback)=>{
        this.publish(packet,callback)
    }

    subscribe: NetworkSubscribe=(topic,callback)=>{

    }

    authenticate: NetworkAuthenticate=(client,uid,pass,callback)=>{
        callback(null,true)
    }

    authorizeSubscribe: NetworkAuthorizeSubscribe=(client,sub,callback)=>{
        callback(null,sub)
    }
    authorizePublish:NetworkAuthorizePublish=(client,packet,callback)=>{
        callback(null)
    }


}

