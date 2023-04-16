import { createLog } from "advance-log";
import { NetworkAuthenticate, NetworkAuthorizePublish, NetworkAuthorizeSubscribe, 
         NetworkCommon, NetworkHandlePublish, NetworkOnConnect, 
         NetworkPublish, NetworkSubscribe } from "./network.interface";
import { PublishPacket } from "packet";
const log=createLog("Network","center");
const _DEBUG=true;
export default class Network implements NetworkCommon{
    servers:NetworkCommon[]=[]
    constructor(...servers:NetworkCommon[]){
        this.servers=servers;
        servers.forEach(server=>{
            // server.on=this.on;
            server.onPublish=(packet,client,server )=>{
                const id=(client&& client.id)?client.id:"server"
                log("\n# %d publish %s=%s",id,packet.topic,packet.payload.toString())
                this.onPublish(packet,client,this);
            }
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
        log("%d(%s) publish-1 %s=%s","server","root",packet.topic,packet.payload)
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

export const packetDefault:PublishPacket={
    topic:'',
    payload:'',
    cmd:'publish',
    qos:0,
    retain:false,
    dup:false
}

interface PublishPacketExt extends PublishPacket{
    payload:any
}
export function createPacket(packet:string|Partial<PublishPacketExt>):PublishPacket{
    const _packet=typeof packet=='string'?{payload:packet}:packet
    const payload=typeof _packet.payload!=='string'?JSON.stringify(_packet.payload):_packet.payload
    return Object.assign({},packetDefault,_packet,{payload})
}
