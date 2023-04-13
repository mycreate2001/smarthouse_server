/** import */
import tEvent, { runCallback } from "../../lib/event";
import { WebSocket, WebSocketServer } from 'ws'
import * as ws from 'ws'
import { createLog } from "advance-log";
import {v4 as uuidv4 } from 'uuid'
import { AuthorizePublishHandle, Subscription}  from "../websocket/websocket.interface";
import {SocketSavePacket, WebSocketExt} from './interface'
import { NotFound, parserJSON, setHandleLogin, setHandletopic, setSubscribeHandle } from "./utility";
import { NetworkAuthenticate, NetworkAuthorizeSubscribe, 
         NetworkCommon, NetworkHandlePublish, NetworkOnConnect, NetworkSubscribe } from "../network/network.interface";
import { PublishPacket } from "packet";
import { UserData } from "../user/user.interfac";

/** default */
const _SOCKET_PORT=8888;
const _SYSTEM_KEY="$SYS"
const _PUBLISH_KEY=_SYSTEM_KEY+"/TOPICS/"
const _DEBUG=false;
const log=createLog("Websocket","center",_DEBUG);

export default class SocketService extends tEvent implements NetworkCommon{
    wss:WebSocketServer;
    db:SocketSavePacket={};
    constructor(socket:WebSocketServer){
        super();
        this.wss=socket;

        /** connect */
        this.wss.on("connection",(ws)=>{
            ws.id=uuidv4();
            if(!ws.publish){
                ws.publish=(data:string|object,callback?:(err:Error|undefined)=>void)=>{
                    const _data=typeof data!=='string'?JSON.stringify(data):data
                    ws.send(_data,callback);
                }
            }
            log("%d connected",ws.id);
            /** handle login: done */
            const handleLogin=setHandleLogin(this);

            /** subscribe sercurity check */
            const subscribeHandle=setSubscribeHandle(this);

            /** handle topics */
            const handletopic=setHandletopic(this);

            /** handle message */
            ws.on("message",(rawMsg)=>{
                const msg=rawMsg.toString();
                log("%d send msg:%s",ws.id,msg.length>100?msg.substring(0,90)+" ...(more)":msg);
                const callbacks=[parserJSON,handleLogin,subscribeHandle,handletopic,NotFound];
                runCallback(callbacks,0,ws,msg);
            })
            ws.on("close",(code,reason)=>{
                log("%d disconnected",ws.id);
                this.onConnect(false,ws,this);  // execute onconnect = offline
                this.emit("clientDisconnect",ws,{code,reason});
                //remove subscribe
                Object.keys(this.db).forEach(topic=>{
                    const db=this.db[topic];
                    if(!db||!db.subscribes||!db.subscribes.length) return;
                    for(let i=db.subscribes.length-1;i--;i>=0){
                        if(db.subscribes[i].ws===ws) db.subscribes.splice(i,1)
                    }
                })
            })

            
            /** handle connect event */
            this.onConnect(true,ws,this);   // execute onconnect =online
            this.emit("client",ws,null)
        })
    }
    onConnect: NetworkOnConnect=(stt,client,server)=>{
        log("[onConnect] ### not be handle")
    }
    /** publish from server 
     * @returns publish result true/false = success/fail
    */
    _publish(packet:PublishPacket){
        log("_publish %s",packet.topic)
        const topic=packet.topic||""
        if(!topic) return false;
        const db=this.db[topic]||{packet,subscribes:[]};
        //save packet
        if(packet.retain){
            if(!this.db[topic]) this.db[topic]=db;//first
            else db.packet=packet;
        }
        //send packet
        db.subscribes.forEach(sub=>sub.ws.send(JSON.stringify(packet)))
     }
    publish=this._publish
    remote(deviceId:string,data:any){}
    getInfor(deviceId:string){ }

    /** subcribe from client (after checking sercurity) 
     * @returns true/false= success/fail
    */
    _subcribe(ws:WebSocketExt,subscription:Subscription):boolean{
        const topic=subscription.topic
        if(!topic) return false;
        const db=this.db[topic];
        if(!db) { // new topic => add first data
            this.db[topic]={subscribes:[{ws,subscription}],packet:null}
            return true;
        }
        //exist db
        const packet=db.packet;
        //send packet if available packet & subscribe with retain=true
        if(packet && subscription.retain) ws.send(JSON.stringify(packet))
        //update subscription
        const _sub=db.subscribes.find(s=>s.ws==ws);
        if(!_sub){ //first times client subscribe
            db.subscribes.push({ws,subscription})
            return true;
        }
        _sub.subscription=subscription;//update sub
        return true;
    }

    onPublish: NetworkHandlePublish=(packet,client,server)=>{

    }

    /** subcribe direct from server bypass sercurity */
    // subscribe(topic:string,callback:NetworkCallback){
    //     const that=this;
    //     const _cb=(ws:WebSocketExt,packet:PublishPacket)=>callback(packet)
    //     return this.on(_PUBLISH_KEY+topic,_cb)
    // }
    subscribe: NetworkSubscribe=(topic,callback)=>{
        const that=this;
        const _cb=(ws:WebSocketExt,packet:PublishPacket)=>callback(packet)
        return this.on(_PUBLISH_KEY+topic,_cb)
    }

    authenticate:NetworkAuthenticate=(client,user,pass,callback)=>callback(null,true);
    authorizeSubscribe:NetworkAuthorizeSubscribe=(client,subscription,callback)=>callback(null,subscription);
    authorizePublish:AuthorizePublishHandle=(client,packet,callback)=>callback(null)
}

declare module "ws" {
    class _WS extends ws.WebSocket {
        publish:(packet:string|Object,callback?:(err:Error|undefined)=>void)=>void;
    }
    export interface WebSocket extends _WS {
        id: string;
    }
}





