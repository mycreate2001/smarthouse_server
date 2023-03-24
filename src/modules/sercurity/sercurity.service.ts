import { createLog } from "../../lib/log";
import UserService from "../user/user.service";
import { AuthenticateHandle, AuthorizePublishHandle, AuthorizeSubscribeHandle } from "../websocket/websocket.interface";
const log=createLog("sercurity","center");
export default class Sercurity{
    service:UserService
    constructor(service:UserService){
        this.service=service
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
        try{
            const user=client.user
            if(!user) throw new Error("Not yet login");
            log("%d (%s) subscribe %s",client.id,user.id,sub.topic);
            callback(null,sub);
        }
        catch(err){
            const _err:Error=err instanceof Error?err:new Error("other error");
            log("%d subscribe %s=>error %s",client.id,sub.topic,_err.message);
            callback(_err,sub)
        }
    }

    authorizePublish:AuthorizePublishHandle=(client,packet,callback)=>{
        try{
            const user=client.user
            if(!user) throw new Error("not yet login")
            log("%d (%s) publish %s\npayload:%s",client.id,user.id,packet.topic,packet.payload.toString());
            callback(null);
        }
        catch(err){
            const _err:Error=err instanceof Error?err:new Error("other error");
            log("%d subscribe %s=>error %s",client.id,packet.topic,_err.message);
            callback(_err)
        }
    }
}

