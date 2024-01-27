import * as Aedes from "aedes";
import { CommonAuthenticate, CommonAuthorizePublish, CommonAuthorizeSubscribe, CommonClient, CommonNetwork, CommonNetworkConnect, Packet, Subscription, correctSubsciption, createPacket } from "../../interface/network.interface";
import { createLog } from "advance-log";
import { PublishPacket } from "packet";
import tEvent from "ultility-tools/dist/lib/event";
// import { PublishPacket } from "packet";
// import * as Net from "net";
const Net=require('net');

const _LABEL="MqttService"
const log=createLog(_LABEL,{enablePos:true});
const _PACKET_DEFAULT:PublishPacket={
    cmd:'publish',
    dup:false,
    retain:false,
    topic:'',
    payload:'',
    qos:0,
}



export default class MqttService implements CommonNetwork{
    mqtt:Aedes.Aedes
    event=new tEvent(true);
    port:number;
    constructor(port:number,callback?:()=>void){
        const mqtt=new Aedes.default();
        this.port=port;
        const server=Net.createServer(mqtt.handle);
        server.listen(port,()=>{
            if(!callback) return;
            if(!checkFns(callback)) return;
            callback();
        })
        
        this.mqtt=mqtt;
        this.mqtt.on("client",(client)=>{
            if(this.onConnect && typeof this.onConnect==='function')
                this.onConnect(client,true);
        })
        this.mqtt.on("clientDisconnect",(client)=>{
            if(!checkFns(this.onConnect)) return;
            this.onConnect(client,false)
        })
        this.mqtt.authenticate=(client,uid,pass,done)=>{
            if(!checkFns(this.authenticate)) return done(null,true);
            const _pass:string=pass.toString();
            this.authenticate(client,uid,_pass,done)
        }

        /** publish */
        this.mqtt.authorizePublish=(client,packet,cb)=>{
            if(packet.cmd!=='publish') return cb(null);
            if(!checkFns(this.authorizePublish)) return cb(null);
            const _client=client?client:{id:server}
            const payload=packet.payload.toString()
            this.authorizePublish(_client,{...packet,payload},cb);
        }

        /** subscribe */
        this.mqtt.authorizeSubscribe=(client,sub,cb)=>{
            if(!checkFns(this.authSubscribe)) return cb(null,sub);
            this.authSubscribe(client,sub,cb)
        }
        /** published */
        this.mqtt.on("publish",(packet,client)=>{
            const cmd=packet.cmd;
            if(cmd!=='publish') return;
            const topic=packet.topic;
            const payload=packet.payload.toString();
            this.event.emit(topic,client,{...packet,payload})
        })
    }
    onConnect: CommonNetworkConnect=(client,online)=>{
        log("%d ",client.id,online?"connect":"disconnect")
    }

    authenticate: CommonAuthenticate=(client,uid,pass,cb)=>{
        log("%d login => success ",client.id,{uid,pass})
        cb(null,true);//bypass
    }
    authorizePublish: CommonAuthorizePublish=(client,packet,cb)=>{
        cb(null);//bypass
    }
    authSubscribe: CommonAuthorizeSubscribe=(client,subs,cb)=>{
        const _subs=correctSubsciption(subs);
        cb(null,_subs)
    }
    publish(topic: string, payload: string | object, opts: Partial<Packet>={}): void {
        payload=payload||""
        log("publish / ### TEST-001: start ",{topic,payload})
        const _payload:string=typeof payload!=='string'?JSON.stringify(payload):payload
        const packet:PublishPacket=Object.assign({},_PACKET_DEFAULT,opts,{payload:_payload,topic});
        this.mqtt.publish(packet,(err)=>{
            log("%d publish %s","server=>",topic,err?"failed":"success");
        })
    }
    
    on(title: string, callback: (client: CommonClient, ...data: any[]) => void): void {
        this.event.on(title,callback)
    }

    once(title: string, callback: (client: CommonClient, ...data: any[]) => void): void {
        this.event.once(title,callback)
    }
}



////////////////////////////////
function checkFns(fns:any):boolean{
    return (fns && typeof fns==='function')?true:false
}

export interface MqttServiceOption{
    callback:()=>void;
}