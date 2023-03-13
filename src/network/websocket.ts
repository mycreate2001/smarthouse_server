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
const _DEBUG=false;
const log=createLog("Websocket","center",_DEBUG);

export default class Socket extends tEvent{
    setting:SocketOptions={port:_SOCKET_PORT}
    clients:WebSocket[]=[];
    wss:WebSocketServer;
    db:SocketSavePacket={};

    constructor(options?:SocketOptions){
        super();
        this.setting=Object.assign(this.setting,options);
        this.wss=new WebSocketServer({port:this.setting.port},()=>{
            const log=createLog("Websocket","center");
            log("start at PORT=%d",this.setting.port)
        });

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

//////////////// MINI FUNCTIONS ////////////////////

/** convert subscription from toptic or subscription */
function toSubscription(subscription:string|Subscription):Subscription{
    if(typeof subscription=='string') return {topic:subscription,qos:0,retain:false}
    return subscription
}
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
                sub=toSubscription(sub);
                if(sub.topic.startsWith(_SYSTEM_KEY)) return erList.push(sub.topic)   // reject system
                server.authorizeSubscribe(ws,sub,(err,subscription:Subscription)=>{
                    const _topic=subscription.topic;
                    if(err) {
                        erList.push(_topic)
                        return;
                    }
                    if(server._subcribe(ws,subscription)) suList.push(_topic)
                    else erList.push(_topic)
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
                // check sercurity
                if(err) return ws.send(JSON.stringify({success:0,msg:err.message}));
                if(!success) return ws.send(JSON.stringify({success:0,msg:"success logic is false"}));
                //send publish message
                ws.send(JSON.stringify({success:1,msg:"login success",topic:"login"}))
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
    return function handletopic(ws:WebSocketExt,packet:PublishPacket,next:Function){
        const topic=packet.topic;
        //check condition
        if(!topic||topic.startsWith(_SYSTEM_KEY)) return ws.send(JSON.stringify({success:0,msg:"wrong topic",topic}))
        // check sercurity
        server.authorizePublish(ws,packet,(err)=>{
            if(err) {
                log("handleTopic: ### reject publish ### ",{err:err.message,topic})
                return ws.send(JSON.stringify({success:0,msg:err.message||"accept denied",topic}))
            }

            // /** sercurity success */
            // const db=server.db[topic]||={packet,subscribes:[]};
            // //save packet to server
            // if(packet.retain){ 
            //     if(!server.db[topic]) server.db[topic]=db;
            // }
            // db.subscribes.forEach(sub=>sub.ws.send(JSON.stringify(db.packet)))
            server.publish(packet);
            server.emit("publish",{...packet,cmd:'publish'},ws)
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

export interface SocketSavePacket{
    [topic:string]:{
        packet:PublishPacket|undefined|null
        subscribes:SocketSubscribePacket[]
    }
}

/** keep subscription on server */
export interface SocketSubscribePacket{
    ws:WebSocketExt;
    subscription:Subscription
}


