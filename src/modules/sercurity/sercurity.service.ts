import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import { wildcard } from "../../lib/wildcard";
import { UserData } from "../user/user.interfac";
import UserService from "../user/user.service";
import { AuthenticateHandle, AuthorizePublishHandle, AuthorizeSubscribeHandle } from "../websocket/websocket.interface";
import { SercurityHandle } from "./sercurity.interface";
const log=createLog("sercurity","center");
const _SERCURITY_DB_="sercurities"
export default class Sercurity{
    service:UserService
    sercurities:SercurityHandle[]=[];
    constructor(service:UserService,db:LocalDatabaseLite){
        this.service=service
        const sDb:DataConnect<SercurityHandle>= db.connect(_SERCURITY_DB_)
        sDb.search().then(sercs=>this.sercurities=sercs)
    }
    authenticate:AuthenticateHandle=(client,uid,pass,callback)=>{
        this.service.login(uid,pass.toString())
        .then(user=>{
            log("%d login '%s'=>success",client.id,uid);
            client.user=user;
            callback(null,true)
        })
        .catch(err=>{
            client.user=null;
            log("%d login '%s'=>failed %s",client.id,uid,err.message)
            callback(err,false)
        })
    }

    authorizeSubscribe:AuthorizeSubscribeHandle=(client,sub,callback)=>{
        const user=client.user||{id:"unknown"}
        try{
            const sercus=this.sercurities.filter(s=>s.ref===sub.topic)
            const result=sercus.every(hd=>handleVerify(hd.subHandles,client))
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

    authorizePublish:AuthorizePublishHandle=(client,packet,callback)=>{
        const user=client.user||{id:"unknown"}
        try{
            const sers=this.sercurities.filter(s=>wildcard(packet.topic,s.ref))
            const result=sers.every(ser=>handleVerify(ser.pubHandles,client))
            if(!result) throw new Error("access deny!")
            log("%d (%s) publish %s\npayload:%s",client.id,user.id,packet.topic,packet.payload.toString());
            callback(null);
        }
        catch(err){
            const _err:Error=err instanceof Error?err:new Error("other error");
            log("%d (%s) publish %s=>error %s",client.id,user.id,packet.topic,_err.message);
            callback(_err)
        }
    }
}

function verify(client:any){
    const user:UserData=client.user;
    return {
        login():boolean{
            if(!user) return false;
            return true
        },
        level(setLevel:number|string):boolean{
            const _slevel=typeof setLevel=='string'?parseInt(setLevel)||9:setLevel;
            const level=user.level||0;
            console.log("\n+++ sercurity.service.ts-75",{level,_slevel})
            if(level<_slevel) return false;
            return true;
        },
        private(){
            if(!this.login()) return false;
        }
    }
}

function handleVerify(fns:string[],client:any):boolean{
    return fns.every(fn=>{
        if(fn.toUpperCase().startsWith("LEVEL")){
            let arrs=fn.split(":");
            const sLevel=arrs[1]||0
            return verify(client).level(sLevel)
        }

        if(fn.toUpperCase().startsWith("LOGIN")){
            return verify(client).login()
        }
        console.log("\n+++ sercurity.service.ts-87 #### ERROR: Out of case");
        return false;
    })
}

