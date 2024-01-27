import { WebSocket, WebSocketServer } from "ws";
import { CommonAuthenticate, CommonAuthorizePublish, CommonAuthorizeSubscribe, CommonClient, CommonHandleAuthSub, CommonNetwork, CommonNetworkConnect, CommonOnMessage, Packet, SubscripStd, Subscription, createPacket } from "../../interface/network.interface";

import { createDebug, createLog } from "advance-log";
import { tEvent, toArray, uuid,runCallback } from "ultility-tools";
import { Qos } from "../../interface/websocket.interface";
const _SYSTEM_KEY="$"

const _LABEL="SocketService"
const log=createLog(_LABEL,{enablePos:true});
const debug=createDebug(_LABEL,1);

export default class SocketService extends tEvent implements CommonNetwork{
    wss!:WebSocketServer;
    db:any={}
    constructor(socket:WebSocketServer){
        super(true);
        this.wss=socket;
        this.wss.on("connection",(ws:SocketExt,req)=>{
            ws.id=uuid();
            ws.subs=[];
            const uid:string=toArray(req.headers.uid).join("") ||"";
            const pass:string=toArray(req.headers.pass).join("")||"";
            // login
            if(req.headers.uid && this.authenticate && typeof this.authenticate=='function'){
                this.authenticate(ws,uid,pass,(err,success)=>{
                    if(err ||!success) {
                        log("%d login falred {uid:%s,pass:%s}",ws.id,uid,pass);
                        ws.close();
                    }
                })
            }
            
            ws.on("message",(rawMsg)=>{
                const callbacks=[parserJSON,subscribe(this),login(this),loginByToken(this),handleTopic(this)];
                runCallback(callbacks,0,ws,rawMsg.toString())
            })

            //run onConnect
            ws.on("close",(code,reason)=>{
                // execute onConnect
                if(this.onConnect && typeof this.onConnect==='function') this.onConnect(ws,false);
                this.emit("connection",ws,false);
                //unsubscribe & remove all items relatise socket
                this.delete(ws.subs);
                
            });
            //run onConnect
            if(this.onConnect && typeof this.onConnect==='function') this.onConnect(ws,true);
            this.emit("connection",ws,true);
        })
    }
    onConnect: CommonNetworkConnect=(client,online)=>{
        log("%d is %s",client.id,online?"connect":"disconnect");
        const clients=Array.from(this.wss.clients).map(ws=>(ws as any).id)
        // debug(1,"clients",{clients})
    }

    authenticate: CommonAuthenticate=(client,uid,pass,callback)=>{
        // if(uid!=='admin' || pass!=='admin') return callback(null,false);
        log("%d login success",client.id,{uid,pass});
        log("%d bypass login","WARING: ")
        callback(null,true);
    }
    authorizePublish: CommonAuthorizePublish=(client,packet,callback)=>{
        callback(null);
    }
    authSubscribe: CommonAuthorizeSubscribe=(client,sub,callback)=>{
        const _sub=correctSubsciption(sub);
        log("\%d subscribe %s\t%d",client.id,_sub.topic,"### WARNING: bypass subscribe security")
        callback(null,_sub)
    }

    publish(topic: string, payload:string|object,opts?:Partial<PublishOption>): void {
        if(!topic || typeof topic!=='string') return;
        const _payload:string=typeof payload==='string'?payload:JSON.stringify(payload)
        const packet:Packet=createPacket({...opts,payload:_payload,topic})
        this.emit(topic,null,packet)
    }

    authByToken(client:CommonClient,token:string,cb:(err:any,success?:boolean)=>void){
        log("%d login by token success ",client.id,{token});
        log("%d bypass by default","### WARNING:");
        const send=(client as any).send;
        if(send && typeof send==='function'){
            const payload:string=JSON.stringify({code:0,data:[]})
            const packet=createPacket({topic:'login-res',payload})
            send(packet)
        }
        cb(null,true);
    }

    _subscribe(client: SocketExt, subs: Subscription | Subscription[]): void {
        const _subs:SubscripStd[]=toArray(subs).map(sub=>correctSubsciption(sub));
        const list:string[]=[];
        _subs.forEach(sub=>{
            const handlerError:CommonHandleAuthSub=(err,xsub)=>{
                if(err||!xsub||!xsub.topic) return;
                const subHandle=(x:CommonClient,packet:Packet)=>{
                    client.send(JSON.stringify(packet))
                }
                this.on(sub.topic,subHandle);
                const pos=client.subs.findIndex(x=>x==subHandle);
                if(pos==-1) client.subs.push(subHandle);
                else client.subs[pos]=subHandle;
                list.push(sub.topic);
            }
            this.authSubscribe(client,sub,handlerError)
        })
        log("%d subscribed [%s]",client.id,list.join());
    }

}


//////////// MINI FUNCITON ///////////
/** convert string to JSON */
function parserJSON(ws:SocketExt,msg:string,next:Function){
    const log=createLog("parserJSON")
    //check
    try{
        if(typeof msg!=='string') throw new Error("parserJSON: msg is not string");
        const obj=JSON.parse(msg) as Packet;
        if(!obj.topic) throw new Error("parser: not exist topic");
        if(obj.payload===undefined) throw new Error("data format, missing 'payload'")
        return next(ws,obj);
    }
    catch(err){
        log("parserJSON: ### ERROR ###\n\t\t",err,"\n",msg);
        return ws.send(JSON.stringify({error:1,msg:"you message is wrong format"}));
    }
}

function handleTopic(service:SocketService){
    return (ws:SocketExt,packet:Packet,next:Function)=>{
        try{
            const topic:string=packet.topic||""
            if(!topic) throw new Error("topic error");
            let auth:CommonAuthorizePublish=service.authorizePublish
            if(typeof auth!=='function') throw new Error("auth is not function")
            auth(ws,packet,(err)=>{
                if(!err) {
                    // debug(1,"#003: publish %s\t",topic,packet);
                    // service.publish(topic,packet);
                    service.emit(topic,ws,packet);
                }
                if(err) ws.close(1,"not auth")
            })
        }
        catch(err){
            const msg=err instanceof Error?err.message:"other"
            log(msg);
        }
    }
}
const _SUBSCRIBE_KEY="subscribe"
/** handle subscribe */
function subscribe(service:SocketService){
    return (ws:SocketExt,packet:Packet,next:Function)=>{
        const topic=packet.topic||""
        if(topic!==_SUBSCRIBE_KEY) return next(ws,packet)
        const subs:Subscription|Subscription[]=typeof packet.payload==='string'?JSON.parse(packet.payload):packet.payload
        service._subscribe(ws,subs)
    }
}

/** handle login */
const _LOGIN_KEY="login"
function login(service:SocketService){
    return (ws:SocketExt,packet:Packet,next:Function)=>{
        const topic=packet.topic||""
        if(topic!==_LOGIN_KEY) return next(ws,packet)
        const {uid,pass}=typeof packet.payload==='string'?JSON.parse(packet.payload):packet.payload
        service.authenticate(ws,uid,pass,(err,success)=>{
            if(err ||!success) {
                log("%d login falred {uid:%s,pass:%s}",ws.id,uid,pass);
                return ws.close();
            }
        })
    }
}

/** handle login */
const _LOGIN_BYTOKEN_KEY="login-by-token"
function loginByToken(service:SocketService){
    return (ws:SocketExt,packet:Packet,next:Function)=>{
        const topic=packet.topic||""
        if(topic!==_LOGIN_BYTOKEN_KEY) return next(ws,packet)
        const {token}=typeof packet.payload==='string'?JSON.parse(packet.payload):packet.payload
        service.authByToken(ws,token,(err,success)=>{
            if(err||!success){
                log("%d login falred {token:%s}",ws.id,token);
                ws.close();
            }
        })
    }
}

/** correct subscription */
function correctSubsciption(subscription:Subscription):SubscripStd{
    return typeof subscription=='string'? {topic:subscription,qos:0}:subscription
}


////////////// INTERFACE ///////////////
export interface PublishOption{
    qos:Qos;
    retain:boolean;
}
export interface SocketExt extends WebSocket,CommonClient{
    id:string;
    subs:any[]
}

