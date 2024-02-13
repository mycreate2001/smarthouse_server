import { WebSocket, WebSocketServer } from "ws";
import { CommonAuthenticate, CommonAuthorizePublish, CommonAuthorizeSubscribe, CommonClient, CommonErrorHandle, CommonHandleAuthSub, CommonNetwork, CommonNetworkConnect, CommonOnMessage, Packet, SubscripStd, Subscription, createPacket } from "../../interface/network.interface";

import { createLog } from "advance-log";
import { tEvent, toArray, uuid,runCallback } from "ultility-tools";
import { Qos } from "../../interface/websocket.interface";
import { UserData, UserDataExt } from "../../interface/user.interface";
const _SYSTEM_KEY="$"

const _LABEL="SocketService"
const log=createLog(_LABEL,{enablePos:true});
// const debug=createDebug(_LABEL,1);
const _PRIVATE_KEY="private"; //
const _LOGINBYTOKEN_REPLY="login-res"; //
const APIs={
    loginByToken:'login-by-token',
    replyPrivate:'private',
    loginReply:'login-res'
}

export default class SocketService extends tEvent implements CommonNetwork{
    wss!:WebSocketServer;
    messageId:number=0;
    db:any={}
    constructor(socket:WebSocketServer){
        super(true);
        this.wss=socket;
        this.wss.on("connection",(ws:SocketExt,req)=>{
            ws.id=uuid();
            ws.subs=[];
            ws.publish=(packet:Packet)=>ws.send(JSON.stringify(packet))
            // this._subscribe(ws,`${APIs.replyPrivate}/${ws.id}/#`)
            const uid:string=toArray(req.headers.uid).join("") ||"";
            const pass:string=toArray(req.headers.pass).join("")||"";
            // login1
            if(req.headers.uid && this.authenticate && typeof this.authenticate=='function'){
                this.authenticate(ws,uid,pass,(err,success)=>{
                    if(err ||!success) {
                        log("%d login falred {uid:%s,pass:%s}",ws.id,uid,pass);
                        const packet=createPacket({topic:`${_PRIVATE_KEY}/${ws.id}/${_LOGINBYTOKEN_REPLY}`,payload:JSON.stringify({error:0,msg:"login failure",data:null})})
                        ws.send(JSON.stringify(packet))
                        // ws.close(1007,JSON.stringify(packet));
                    }
                })
            }
            
            ws.on("message",(rawMsg)=>{
                const callbacks=[parserJSON,subscribe(this),login(this),loginByToken(this),handleTopic(this)];
                runCallback(callbacks,0,ws,rawMsg.toString())
            })

            //run onConnect
            ws.on("close",(code,reason)=>{
                log("disconnect ",{code,reason:reason.toString()})
                // execute onConnect
                if(this.onConnect && typeof this.onConnect==='function') this.onConnect(ws,false);
                this.emit("connection",ws,false);
                //unsubscribe & remove all items relatise socket
                this.delete(ws.subs);
                
            });

            //run onConnect
            // const packet=createPacket({topic:`private/${ws.id}/connect`,payload:ws.id})
            // ws.send(JSON.stringify(packet));        //send client.id
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
        // this.publish(`${_PRIVATE_KEY}/${client.id}/${APIs.loginReply}`,{})
    }
    authorizePublish: CommonAuthorizePublish=(client,packet,callback)=>{
        log("%d check publish %s =>%s, %d",client.id,packet.topic,"success","WARINING: bypass");
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
        const packet:Packet=createPacket({...opts,payload:_payload,topic,messageId:this.messageId++})
        this.emit(topic,null,packet)
    }

    authByToken(client:CommonClient,token:string,cb:(err:any,user?:UserData)=>void){
        log("%d login by token success, WARNING: default bypass",client.id,{token});
        this.publish(`${_PRIVATE_KEY}/${client.id}/${_LOGINBYTOKEN_REPLY}`,{token})
        cb(null);
    }

    /**
     * subscribe topic for client from server,bypass sercurity
     * @param client 
     * @param subs 
     */
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
        const _msg:string=err instanceof Error?err.message:"other"
        log("### ERROR: %s\n",_msg);
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
        //not subscribe >> next
        if(topic!==_SUBSCRIBE_KEY) return next(ws,packet)
        // subscribe
        const payload=packet.payload;
        const obj=typeof payload==='string'?JSON.parse(payload):payload;
        const subs:Subscription[]=toArray(obj.subscribes)
        if(service.authSubscribe && typeof service.authSubscribe==='function') {
            const list:SubscripStd[]=[]
            subs.forEach(sub=>service.authSubscribe(ws,sub,(err,_sub)=>{
                if(err||!_sub||!_sub.topic) return;
                list.push(_sub);
            }))
            service._subscribe(ws,list);
        }
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
        service.authByToken(ws,token,(err,user)=>{
            if(err||!user){
                log("%d login falred {token:%s}",ws.id,token);
                ws.close();
                return;
            }

            //send user infor


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
export interface SocketExt extends WebSocket, CommonClient{
    id:string;
    subs:any[];
    eid?:string;
    user?: UserDataExt | undefined;
    publish:(packet: Packet, callback?: CommonErrorHandle )=>void;
    
}

