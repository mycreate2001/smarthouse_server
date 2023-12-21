import { createLog } from "advance-log";
import { ErrorCode, NetworkAuthenticate, NetworkAuthorizePublish, NetworkAuthorizeSubscribe, 
         NetworkClient, 
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
            server.onConnect=(online,client,server)=> this.onConnect(online,client,this);
            server.publish=(packet,callback)=>this.publish(packet,callback);
            server.subscribe=this.subscribe;
        })
    }

    onPublish: NetworkHandlePublish=(packet,client,server)=>{
        log("[publish] ### NOT BE HANDLE");
    }

    onConnect: NetworkOnConnect=(client,server)=>{
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
        return this.servers.map(server=>server.subscribe(topic,callback))
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


//// handle client publish //////////

/**
 * This is a TypeScript function that publishes a message directly to client with an optional error
 * code and returns a success message or an error message.
 * @param {string} topic - The topic to which the message is being published.
 * @param {string|object} msg - The message payload that will be sent to the MQTT broker. It can be
 * either a string or an object. If it is an object, it will be converted to a JSON string before being
 * sent.
 * @param {NetworkClient} client - The NetworkClient object that represents the client that is
 * publishing the message.
 * @param {number|string} [errCode=0] - The error code to be included in the payload of the MQTT
 * publish packet. If there is no error, it can be set to 0 or left blank.
 */
export function clientPublish(client:NetworkClient,topic:string,errCode:ErrorCode,data?:string|Object){
    let packet=createPacket({payload:Object.assign({...errCode},{data}),topic})
    client.publish(packet,clientPublishMessage(client,packet))
}

/** handle message for client publish */
function clientPublishMessage(client:NetworkClient,packet:PublishPacket,code?:string|number){
    return function errHandle(err:Error|undefined){
        const result=err?"failred":"success"
        code=code||""
        log("%d[private publish] to %s=>%d\n\tmsg:%s",code,client.id,result,packet.payload.toString())
    }
}


