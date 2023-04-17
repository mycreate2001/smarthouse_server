import aedesServer from "aedes:server";
import { createLog } from "advance-log";
import { NetworkAuthenticate, NetworkAuthorizePublish, NetworkAuthorizeSubscribe, 
        NetworkCommon, NetworkHandleError, NetworkHandlePublish, NetworkOnConnect, 
        NetworkPublish, NetworkSubscribe } 
        from "../network/network.interface";
import * as aedes from 'aedes'
const Net=require('net')

const log=createLog("MqttService","center")
const _DEFAULT_PORT=1883;

export default class MqttService implements NetworkCommon{
    mqtt:aedesServer
    constructor(opts:Partial<MqttOptions>){
        const port=(opts&&opts.port)?opts.port:_DEFAULT_PORT
        const callback=(opts&& opts.callback)?opts.callback:defaultCallback
        const mqtt=new aedes.default()
        const server=Net.createServer(mqtt.handle);
        server.listen(port,()=>callback(port))
        this.mqtt=mqtt;
        /** execute online/offline */
        mqtt.on("client",(client)=>{
            this.onConnect(true,client,this);//online
        })
        mqtt.on("clientDisconnect",(client)=>{
            this.onConnect(false,client,this)
        })
        /** publish */
        mqtt.on("publish",(packet,client)=>{
            if(packet.cmd!=='publish') return;
            this.onPublish(packet,client,this);
        })

        /** sercurity */
        mqtt.authenticate=(client,uid,pass,callback)=>{
            this.authenticate(client,uid,pass.toString(),callback)
        }
    }
    // on: NetworkOn=(topic,callback)=>{
    //     this.mqtt.on(topic,callback)
    // }

    onConnect: NetworkOnConnect=(client)=>{}

    authenticate: NetworkAuthenticate=(client,uid,pass,callback)=>{
        callback(null,true);
    }

    authorizePublish: NetworkAuthorizePublish=(client,packet,callback)=>{
        callback(null);
    }

    authorizeSubscribe: NetworkAuthorizeSubscribe=(client,sub,callback)=>{
        callback(null,sub);
    }

    _publish: NetworkPublish=(packet,callback)=>{
        const _callback:NetworkHandleError=(err)=>{
            if(err) log("### error:",err);
        }
        this.mqtt.publish(packet,callback||_callback);
    }

    // onPublish: Networ=(packet,client,server)=>{
    //     log("[publish] packet:",packet)
    // }
    onPublish: NetworkHandlePublish=(packet,client,server)=>{
        log("\n[onPublish] ### WARNING! Not be handler\n\t\t\tpacket:",packet)
    }
    subscribe: NetworkSubscribe=(topic,callback)=>{
        this.mqtt.subscribe(topic,callback,()=>{console.log('\n+++ mqtt.service.ts-72 +++ ',{topic})})
    }
    publish: NetworkPublish=this._publish;

}

export interface MqttOptions{
    port:number;
    callback:(port:number)=>any;
}

const defaultCallback=(port:number)=>{
    log("mqtt start at %d",port)
}