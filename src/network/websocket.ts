/** import */
import tEvent, { runCallback } from "../lib/event";
import { WebSocketServer,WebSocket } from 'ws'
import { createLog } from "../lib/log";
import {v4 as uuidv4 } from 'uuid'
import { AuthenticateHandle, AuthorizePublishHandle, AuthorizeSubscribeHandle,
         PublishPacket, ServerSubscribeHandle, SubscribePacket, SubscribePayload, Subscription}  from "./interface.type";
import { toArray } from "../lib/utility";

/** default */
const _SOCKET_PORT=8888;
const _SYSTEM_KEY="$SYS"
const _PUBLISH_KEY=_SYSTEM_KEY+"/TOPICS/"
const log=createLog("Websocket","center");

export default class Socket extends tEvent{
    setting:SocketOptions={port:_SOCKET_PORT}
    clients:WebSocket[]=[];
    wss:WebSocketServer;
    constructor(options?:SocketOptions){
        super();
        this.setting=Object.assign(this.setting,options);
        this.wss=new WebSocketServer({port:this.setting.port},()=>{
            log("start at PORT=%d",this.setting.port)
        });

        /** connect */
        this.wss.on("connection",(ws:WebSocketExt)=>{
            ws.id=uuidv4();
            const token=
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
                this.emit("clientDisconnect",{code,reason});
                const pos=this.clients.findIndex(c=>c===ws);
                if(pos!==-1) this.clients.splice(pos,1);
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
        this.emit(_PUBLISH_KEY+topic,{id:'server'},packet);
        return true;
    }

    /** subcribe from clients (not check sercurity) */
    _subcribe(ws:WebSocketExt,topics:string|string[]){
       let _topics:string[]=[];
       _topics=_topics.concat(topics);
       if(!_topics.length) return false;//not success
       _topics.forEach(topic=>{
            this.on(_PUBLISH_KEY+topic,(ws1:WebSocketExt,data:any)=>{
                log("%s publish tp '%s' to '%s'",ws1.id,topic,ws.id)
                ws.send(JSON.stringify(data))
            })
            log("_subscribe: test-01",{events:JSON.stringify(this._events)})
       })
    }

    /** subcribe direct from server bypass sercurity */
    subscribe(topic:string,callback:ServerSubscribeHandle){
        const that=this;
        const _cb=(ws:WebSocketExt,packet:PublishPacket)=>{
            callback(packet)
        }
        return this.on(_PUBLISH_KEY+topic,_cb)
    }

    authenticate:AuthenticateHandle=(client,user,pass,callback)=>callback(null,true);
    authorizeSubscribe:AuthorizeSubscribeHandle=(client,subscription,callback)=>callback(null,subscription);
    authorizePublish:AuthorizePublishHandle=(client,packet,callback)=>callback(null)
}

//////////////// MINI FUNCTIONS ////////////////////
 /** subscribe sercurity check */
 function setSubscribeHandle(server:Socket){
    return function subscribeHandle(ws:WebSocketExt,msg:SubscribePacket,next:Function){
        const topic=msg.topic
        if(topic.toLowerCase()!=='subscribe') return next(ws,msg);
        try{
            const subs=toArray(JSON.parse(msg.payload.toString()) as SubscribePayload)
            const suList:string[]=[];
            const erList:string[]=[];
            subs.forEach(sub=>{
                const _df:Subscription={qos:0,retain:false,topic:''}
                const _sub=Object.assign(_df,typeof sub=='string'?{topic:sub}:sub);
                if(_sub.topic.startsWith(_SYSTEM_KEY)) return erList.push(_sub.topic)   // reject system
                server.authorizeSubscribe(ws,_sub,(err,subscription:Subscription)=>{
                    const _topic=subscription.topic;
                    if(err) {
                        erList.push(_topic)
                        return;
                    }
                    suList.push(_topic)
                    server._subcribe(ws,_topic);
                })
                ws.send(JSON.stringify({success:suList.length,msg:suList.length?"success topics:["+suList.join()+"]":""+erList.length?"failured topics:["+erList.join()+"]":""}))
            }) 
        }
        catch(err){
            log("subscribeHandle: ### ERROR ###\n\t",err);
            return ws.send(JSON.stringify({sussess:0,msg:"subscribe is failred!",topic}))
        }
    }
}

/** handle login */
function setHandleLogin(server:Socket){
    return function handleLogin(ws:WebSocketExt,data:PublishPacket,next:Function){
        try{
            const topic:string=data.topic||"";
            if(!topic||typeof topic!=='string') throw new Error("login: topic is wrong");
            if(topic.toLowerCase()!=='login') return next(ws,data); // not login topic
            // handle login
            const payload=JSON.parse(data.payload.toString()||"{}")||{}
            const user=payload.user||"";
            const pass=payload.pass||"";
            if(!user||!pass) throw new Error("login: not get probaly username or password");
            server.authenticate(ws,user,pass,(err,success)=>{
                if(err) return ws.send(JSON.stringify({success:0,msg:err.message}));
                if(!success) return ws.send(JSON.stringify({success:0,msg:"success logic is false"}));
                return ws.send(JSON.stringify({success:1,msg:"login success",topic:"login"}))
            })

        }
        catch(err){
            log("authticate: ### ERROR ###",err)
            return ws.send(JSON.stringify({success:0,msg:"internal error"}))
        }

    }
}

/** handle topics */
function setHandletopic(server:Socket){
    return function handletopic(ws:WebSocketExt,msg:PublishPacket,next:Function){
        const topic=msg.topic;
        //check condition
        if(!topic||topic.startsWith(_SYSTEM_KEY)) return ws.send(JSON.stringify({success:0,msg:"wrong topic",topic}))
        // check sercurity
        server.authorizePublish(ws,msg,(err)=>{
            if(err) {
                log("handleTopic: ### reject publish ### ",{err:err.message,topic})
                return ws.send(JSON.stringify({success:0,msg:err.message||"accept denied",topic}))
            }
            const length=server.emit(_PUBLISH_KEY+topic,ws,msg);
            if(!length) return next(ws,msg);
            return ws.send(JSON.stringify({success:1,msg:"publish is success",topic}))
        })
    }
}

/** parser & check JSON message */
function parserJSON(ws:WebSocketExt,msg:string,next:Function){
    //check
    try{
        if(typeof msg!=='string') throw new Error("parserJSON: msg is not string");
        const obj=JSON.parse(msg);
        if(!obj.topic) throw new Error("parser: not exist topic");
        return next(ws,obj);
    }
    catch(err){
        log("parserJSON: ### ERROR ###\n\t\t",err);
        return ws.send(JSON.stringify({success:0,msg:"you message is wrong format"}));
    }
}

/**  */
function NotFound(ws:WebSocket,msg:PublishPacket,next:Function){
    return ws.send(JSON.stringify({success:0,msg:"bad request",topic:msg.topic}))
}


//////////////////////
interface SocketOptions{
    port:number
}

export type SocketHandle=(ws:WebSocketExt,msg:PublishPacket,next?:Function)=>void;

interface WebSocketExt extends WebSocket{
    id:string;
    uid?:string;
    token?:string;
}
