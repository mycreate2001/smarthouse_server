// import WebSocket from "ws";
import { WebSocket, WebSocketServer } from "ws";
import { GeneralAuthenticate, GeneralAuthorizePublish, GeneralAuthorizeSubscribe, GeneralNetwork, GeneralNetworkConnect, GeneralOnMessage, Packet, SubscripStd, Subscription } from "../../interface/network.interface";
import tEvent, { runCallback } from "../../lib/event";
import { createOption, toArray, uuid } from "../../lib/utility";
import { createDebug, createLog } from "advance-log";
const _SYSTEM_KEY="$"

const _LABEL="SocketService"
const log=createLog(_LABEL,"center");
const debug=createDebug(_LABEL,1);
export default class SocketService extends tEvent implements GeneralNetwork{
    wss!:WebSocketServer;
    db:any={}
    constructor(socket:WebSocketServer){
        super();
        this.wss=socket;
        this.wss.on("connection",(ws:SocketExt,req)=>{
            ws.id=uuid();
            const uid:string=toArray(req.headers.uid).join("") ||"";
            const pass:string=toArray(req.headers.pass).join("")||""
            // login
            if(this.authenticate && typeof this.authenticate=='function'){
                this.authenticate(ws,uid,pass,(err,success)=>{
                    if(err ||!success) {
                        log("%d login falred {uid:%s,pass:%s}",ws.id,uid,pass);
                        ws.close();
                    }
                })
            }

            ws.on("message",(rawMsg)=>{
                const callbacks=[parserJSON,handleTopic(this)];
                runCallback(callbacks,0,ws,rawMsg.toString())
            })

            //run onConnect
            ws.on("close",(code,reason)=>{
                if(this.onConnect && typeof this.onConnect==='function') this.onConnect(ws,false);
            });
            //run onConnect
            if(this.onConnect && typeof this.onConnect==='function') this.onConnect(ws,true);
        })
    }
    onConnect: GeneralNetworkConnect=(client,online)=>{
        log("%d is %s",client.id,online?"connect":"disconnect")
    }

    authenticate: GeneralAuthenticate=(client,uid,pass,callback)=>{
        if(uid!=='admin' || pass!=='admin') return callback(null,false);
        debug(1,"%d login {uid:%s,pass:%s}",client.id,uid,pass);
        callback(null,true);
    }
    authorizePublish: GeneralAuthorizePublish=(client,packet,callback)=>{
        
    }
    authSubscribe: GeneralAuthorizeSubscribe=(client,subs,callback)=>{}
    publish(topic: string, payload: string | object, opts?: Partial<Packet> | undefined): void {
        
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
        log("parserJSON: ### ERROR ###\n\t\t",err);
        return ws.send(JSON.stringify({error:1,msg:"you message is wrong format"}));
    }
}

function handleTopic(service:SocketService){
    return (ws:SocketExt,packet:Packet,next:Function)=>{
        try{
            const topic:string=packet.topic||""
            if(!topic) throw new Error("topic error");
            let auth:GeneralAuthorizePublish=service.authorizePublish?service.authorizePublish:(client,packet,cb)=>cb(null)
            if(typeof auth==='function'){
                auth(ws,packet,(err)=>{
                    if(!err) service.publish(topic,packet);
                    if(err) ws.close(1,"not auth")
                })
            }
            else {
                ws.close();//disconnect
                throw new Error("auth is not function");
            }
        }
        catch(err){
            const msg=err instanceof Error?err.message:"other"
            log(msg);
        }
    }
}

/** handle login */
function setHandleLogin(server:SocketService){
    const log=createLog("HandleLogin")
    return function handleLogin(ws:SocketExt,data:Packet,next:Function){
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


/** correct subscription */
function correctSubsciption(subscription:Subscription):SubscripStd{
    return typeof subscription=='string'? {topic:subscription,qos:0}:subscription
}

interface SocketExt extends WebSocket{
    id:string;
}