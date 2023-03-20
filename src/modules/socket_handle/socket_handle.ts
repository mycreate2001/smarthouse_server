/** import */
import tEvent, { runCallback } from "../../lib/event";
import { WebSocketServer,WebSocket } from 'ws'
import { createLog } from "../../lib/log";
import {v4 as uuidv4 } from 'uuid'
import { AuthenticateHandle, AuthorizePublishHandle, AuthorizeSubscribeHandle,
         PublishPacket, ServerSubscribeHandle, SubscribePacket, SubscribePayload, Subscription}  from "../websocket/websocket.interface";
import {SocketSavePacket, WebSocketExt} from './interface'
import { NotFound, parserJSON, setHandleLogin, setHandletopic, setSubscribeHandle } from "./utility";
import { NetworkConfig, NetworkConnect, NetworkUpdate } from "../network/network";

/** default */
const _SOCKET_PORT=8888;
const _SYSTEM_KEY="$SYS"
const _PUBLISH_KEY=_SYSTEM_KEY+"/TOPICS/"
const _DEBUG=false;
const log=createLog("Websocket","center",_DEBUG);

export default class SocketService extends tEvent{
    wss:WebSocketServer;
    db:SocketSavePacket={};
    constructor(socket:WebSocketServer){
        super();
        this.wss=socket;

        /** connect */
        this.wss.on("connection",(ws:WebSocketExt)=>{
            ws.id=uuidv4();
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
            this.emit("client",ws,null)
        })
    }

    /** publish from server 
     * @returns publish result true/false = success/fail
    */
    publish(packet:PublishPacket){
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

    onConnect:NetworkConnect=(packet,client,server)=>null;
    onUpdate:NetworkUpdate=(packet,client,server)=>null;
    onConfigure:NetworkConfig=(packet,client,server)=>null;
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
            console.log("\n*** _subscribe-001/db=\n",db)
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
            console.log("\n*** _subscribe-002/db=\n",db)
            return true;
        }
        _sub.subscription=subscription;//update sub
        console.log("\n*** _subscribe-003/db=\n",db)
        return true;
    }

    /** subcribe direct from server bypass sercurity */
    subscribe(topic:string,callback:ServerSubscribeHandle){
        const that=this;
        const _cb=(ws:WebSocketExt,packet:PublishPacket)=>callback(packet)
        return this.on(_PUBLISH_KEY+topic,_cb)
    }

    authenticate:AuthenticateHandle=(client,user,pass,callback)=>callback(null,true);
    authorizeSubscribe:AuthorizeSubscribeHandle=(client,subscription,callback)=>callback(null,subscription);
    authorizePublish:AuthorizePublishHandle=(client,packet,callback)=>callback(null)
}





