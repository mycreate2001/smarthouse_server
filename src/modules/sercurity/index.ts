import { createLog } from "../../lib/log";
import { ModulePackage } from "../../lib/module-loader/module.interface";
import { AuthenticateHandle, AuthorizePublishHandle, AuthorizeSubscribeHandle } from "../websocket/websocket.interface";
import UserService from "../user/user.service";
import Sercurity from "./sercurity.service";
export default function startup(infor:ModulePackage,networks:any[],userService:UserService){
    const log=createLog(infor.id,"center")
    try{
        //input & verify
        if(!networks||!networks.length) throw new Error("load network failred!")
        if(!userService) throw new Error("load userService failred")
        const sercurity=new Sercurity(userService);
        networks.forEach(network=>{
            network.authenticate=sercurity.authenticate;
            network.authorizePublish=sercurity.authorizePublish;
            network.authorizeSubscribe=sercurity.authorizeSubscribe
        })
        log("load success!");
        return 1;//

    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        log("#ERROR:%s\n",msg);
        return null;
    }
}