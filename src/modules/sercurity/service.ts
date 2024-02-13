import { createLog } from "advance-log";
import { DriverHook, DriverPacket } from "../../interface/device-service.interface";
import { CommonNetworkPacket, correctSubsciption, createPacket } from "../../interface/network.interface";
import { UserServiceData } from "../../interface/user.interface";
import { getList, wildcard } from "ultility-tools";

const _LABEL="sercurity"
const _DEFAULT_ALLOWPUBLISH_TOPIC:boolean=true;
const _DEFAULT_ALLOWSUBSCRIBE_TOPIC:boolean=true;
const _TOKEN_STARTWITH='$TOKEN'
const _PRIVATE_KEY='private'
const _LOGIN_REPLY="login-res"

const log=createLog(_LABEL,{enablePos:true})
export interface SercurityServiceOption{
    allowPublishOtherTopic:boolean;     // allow publish other topics not include services
    allowSubscribeOtherTopic:boolean;   // allow subscribe other topic, not include serices
}

export default function SercurityService(userService:UserServiceData,networks:CommonNetworkPacket[],drivers:DriverPacket[],opts:Partial<SercurityServiceOption>={}){
    const allowPublish=opts.allowPublishOtherTopic||_DEFAULT_ALLOWPUBLISH_TOPIC;
    const allowSubscribe=opts.allowSubscribeOtherTopic||_DEFAULT_ALLOWSUBSCRIBE_TOPIC
    networks.forEach(network=>{
        /** authentication */
        const networkService=network.service;
        networkService.authenticate=async (client,uid,pass,cb)=>{
            const replyTopic:string=`${_PRIVATE_KEY}/${client.id}/${_LOGIN_REPLY}`
            try{
                if(!uid ||typeof uid!=='string') throw new Error("invalid uid");
                //case 1  verify by token
                if(uid.startsWith(_TOKEN_STARTWITH)){
                    // const token=pass;
                    const user=await userService.loginByToken(pass);
                    client.user=user;
                    networkService.publish(replyTopic,JSON.stringify({user}))
                    log("%d loginByToken => %s token:%s",client.id,"success",pass)
                    cb(null,true);
                    return;

                }
                const user=await userService.login(uid,pass);
                client.user=user;
                log("%d login => %s ",client.id,"success",{uid,pass})
                networkService.publish(replyTopic,JSON.stringify({error:0,data:user,msg:'login success'}))
                cb(null,true);

            }
            catch(err){
                const msg=err instanceof Error?err.message:"other"
                await networkService.publish(replyTopic,JSON.stringify({error:1,msg,data:null}))
                log("%d login ERROR:%s",client.id,msg,{uid,pass})
                cb(err,false)
            }
            
        }

        /** publish */
        networkService.authorizePublish=(client,packet,cb)=>{
            // check login
            const user=client.user;
            if(!user) throw new Error("not yet login");
            const topic:string=packet.topic
            try{
                const _drivers=drivers.filter(d=>d.networkIds.includes(network.id));
                const services:DriverHook[]=_drivers.reduce<DriverHook[]>((acc,cur)=>{
                    let _services:DriverHook[]=Object.keys(cur.services).map(id=>Object.assign({id,...cur.services[id]}))
                    _services=_services.filter(sv=>wildcard(topic,sv.ref))
                    return [...acc,..._services]
                },[])
                
                // no service
                if(!services.length) {
                    if(allowPublish) return cb(null)
                    else throw new Error("not allow other link")
                }

                // check list
                const list:string[]=getList(services,"type");
                const excepts:string[]=list.filter(l=>!user.subs.includes(l));
                if(excepts.length) {
                    const err=new Error("some topics denied")
                    log(err.message,"  ",excepts);
                    throw err
                }
                //final OK
                cb(null)
                
            }
            catch(err){
                // error
                const msg:string=err instanceof Error?err.message:"other"
                log("%d check publish %s=>%s,reason %s",client.id,topic,"Failured",msg);
                cb(err)
            }

        }

        /** subscribe */
        networkService.authSubscribe=(client,sub,cb)=>{
            const _sub=correctSubsciption(sub);
            try{
                const user=client.user;
                if(!user) throw new Error("Not login yet");
                const _drivers=drivers.filter(d=>d.networkIds.includes(network.id));
                const services:DriverHook[]=_drivers.reduce<DriverHook[]>((acc,cur)=>{
                    let _services:DriverHook[]=Object.keys(cur.services).map(id=>Object.assign({},{id,...cur.services[id]}))
                    _services=_services.filter(sv=>wildcard(_sub.topic,sv.ref))
                    return [...acc,..._services]
                },[])

                // check other topics
                if(!services.length){
                    if(allowSubscribe) return cb(null,_sub);
                    throw new Error("Not allow other topic")
                }

                // check list
                const list:string[]=getList(services,"type");
                if(!list.includes(_sub.topic)) throw new Error("accept deined");

                // final
                cb(null,_sub);

            }
            catch(err){
                // error
                const msg:string=err instanceof Error?err.message:"other"
                log("%d check subscribe %s => %s,reason %s",client.id,_sub.topic,"Failured",msg);
                cb(err,undefined)
            }
        }

        // const _drivers:DriverPacket[]=drivers.filter(d=>d.networkIds.includes(network.id));
    })
}