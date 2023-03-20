import { createLog } from "../../lib/log";
import { InputModule, ModuleInfor } from "../../lib/module-loader/module.interface";
import { AuthenticateHandle } from "../websocket/websocket.interface";
import UserService from "../user/user.service";
import Network from "../network/network";
export default function startup(infor:ModuleInfor,networks:any[],userService:UserService){
    const log=createLog(infor.id,"center")
    try{
        //input & verify
        if(!networks||!networks.length) throw new Error("load network failred!")
        if(!userService) throw new Error("load userService failred")

        //execute
        const authenticate:AuthenticateHandle=(client,uid,pass,callback)=>{
           userService.login(uid,pass.toString())
           .then(user=>callback(null,true))
           .catch(err=>callback(err,false))
        }
        networks.forEach(network=>{
            network.authenticate=authenticate;
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