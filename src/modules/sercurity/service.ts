import { createLog } from "advance-log";
import { wildcard } from "../../lib/wildcard";
import UserService from "../user/user.service";
// import { AuthenticateHandle, AuthorizePublishHandle, AuthorizeSubscribeHandle } from "../websocket/websocket.interface";
import { Sercurity, SercurityCommon, SercurityFunc } from "./interface";
import { NetworkAuthenticate, NetworkAuthorizePublish, NetworkAuthorizeSubscribe, NetworkClient } from "../network/network.interface";
import { getParams } from "../../lib/utility";
import { toArray } from "local-database-lite";
const log=createLog("sercurity","center");
/** defined */
const _DEBUG_VERIFY=true;       // enable debug verify functions
const _EID_LABEL="eid";         // eid label for private verify


export default class SercurityService implements SercurityCommon{
    service:UserService
    sercurities:Sercurity[]=[];
    constructor(service:UserService){
        this.service=service
    }
    authenticate:NetworkAuthenticate=(client,uid,pass,callback)=>{
        this.service.login(uid,pass.toString())
        .then(user=>{
            log("%d login '%s'=>success",client.id,uid);
            client.user=user;
            callback(null,true)
        })
        .catch(err=>{
            client.user=undefined;
            log("%d login '%s'=>failed %s",client.id,uid,err.message)
            callback(err,false)
        })
    }

    authorizeSubscribe:NetworkAuthorizeSubscribe=(client,sub,callback)=>{
        const user=client.user||{id:"unknown"}
        const topic=sub.topic;
        try{
            const sercus=this.sercurities.filter(s=>wildcard(sub.topic,s.ref))
            const result=sercus.every(sercu=>handleVerify['subscribe'](sercu,client,topic))
            if(!result) throw new Error("access deny!")
            log("%d (%s) subscribe %s",client.id,user.id,sub.topic);
            callback(null,sub);
        }
        catch(err){
            const _err:Error=err instanceof Error?err:new Error("other error");
            log("%d (%s) subscribe %s=>error %s",client.id,user.id,sub.topic,_err.message);
            callback(_err,sub)
        }
    }

    authorizePublish:NetworkAuthorizePublish=(client,packet,callback)=>{
        const user=client.user||{id:"unknown"}
        const topic=packet.topic;
        try{
            const sers=this.sercurities.filter(s=>wildcard(packet.topic,s.ref))
            const result=sers.every(ser=>handleVerify['publish'](ser,client,topic))
            if(!result) throw new Error("access deny!")
            log("%d (%s) publish '%s'='%s'",client.id,user.id,packet.topic,packet.payload.toString());
            callback(null);
        }
        catch(err){
            const _err:Error=err instanceof Error?err:new Error("other error");
            log("%d (%s) publish %s=>error %s",client.id,user.id,packet.topic,_err.message);
            callback(_err)
        }
    }

    setSercurity(sercurities:Sercurity|Sercurity[]){
        console.log("\n++++ sercurity.service.ts-70 +++ sercuritylist");
        this.sercurities=toArray(sercurities);
        console.table(this.sercurities);
    }
}

const verify:SercurityFunc = {
    login(client:NetworkClient,value:number|string): boolean {
        const user = client.user;
        if(_DEBUG_VERIFY)
            console.log("\n++++ sercurity.service.ts-68 [verify.login] client '%s' =>%s+++",client.id,!!user);
        return !!user;
    },
    level(client:NetworkClient,value: number|string): boolean {
        const user=client.user
        const _slevel:number = typeof value == 'string' ? parseInt(value) || 10 : value;
        // if(!user||value==undefined) return false;
        const level = user? user.level:0;
        const result=_slevel<=level;
        if(_DEBUG_VERIFY)
            console.log("\n+++ sercurity.service.ts-79 [verify.level] '%s' =>%s ++++\ndetail: ",client.id,result, { level,_slevel,result,value })
        if (level < _slevel) return false;
        return true;
    },
    private(client:NetworkClient,value: number|string,ref:string,topic:string) {
        if(!this.login(client)) return false;
        const user=client.user;
        let eid:string=getParams(topic,ref)[_EID_LABEL];
        if(!eid||!user){
            if(_DEBUG_VERIFY)
                console.log("\n+++ sercurity.service.ts-91 [verify.private] %s=>false ++++ case#1: EID or User\ndetail:",client.id,{topic,ref,user,eid})
            return false;
        }
        if(eid!==client.id){
            if(_DEBUG_VERIFY)
                console.log("\n+++ sercurity.service.ts-96 [verify.private] %s=>false ++++ case#2: denied topic\ndetail:",client.id,{topic,ref,user,eid})
            return false;
        }
        if(_DEBUG_VERIFY)
            console.log("\n+++ sercurity.service.ts-100 [verify.private] %s=>true ++++ case#3: success\ndetail:",client.id,{topic,ref,user,eid})
        return true;
    }
}



const handleVerify={
    subscribe(sercurity:Sercurity,client:NetworkClient,topic:string){
        const fns=sercurity.subcribe;
        const ref=sercurity.ref;
        return fns.every(fn=>verify[fn.type](client,fn.value,ref,topic))
    },
    publish(sercurity:Sercurity,client:NetworkClient,topic:string){
        const fns=sercurity.publish;
        const ref=sercurity.ref;
        return fns.every(fn=>verify[fn.type](client,fn.value,ref,topic))
    }
}


