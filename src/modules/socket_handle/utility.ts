//////////////// MINI FUNCTIONS ////////////////////

import { createLog } from "../../lib/log";
import { toArray } from "../../lib/utility";
import { PublishPacket, SubscribePacket, SubscribePayload, Subscription } from "../interface.type";
import { WebSocketExt } from "./interface";
import SocketService from "./socket_handle";
const _SYSTEM_KEY="$"


/** convert subscription from toptic or subscription */
export function toSubscription(subscription:string|Subscription):Subscription{
    if(typeof subscription=='string') return {topic:subscription,qos:0,retain:false}
    return subscription
}
 /** subscribe sercurity check */
export function setSubscribeHandle(server:SocketService){
    const log=createLog("subscribeHandle")
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
export function setHandleLogin(server:SocketService){
    const log=createLog("HandleLogin")
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
export function setHandletopic(server:SocketService){
    const log=createLog("Handletopic")
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
            server.publish(packet);
            server.emit("publish",{...packet,cmd:'publish'},ws)
        })
    }
}

/** parser & check JSON message */
export function parserJSON(ws:WebSocketExt,msg:string,next:Function){
    const log=createLog("parserJSON")
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
export function NotFound(ws:WebSocketExt,msg:PublishPacket,next:Function){
    return ws.send(JSON.stringify({success:0,msg:"bad request",topic:msg.topic}))
}