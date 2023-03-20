import { createLog } from "../../lib/log";
import { InputModule, ModuleInfor } from "../../lib/module-loader/module.interface";
import { AuthenticateHandle } from "../interface.type";
import UserService from "../user_service/user.service";
export default function startup(infor:ModuleInfor,modules:InputModule){
    const log=createLog(infor.id,"center")
    try{
        //input & verify
        const networkModules=modules.network
        const serviceModules=modules.user_service;
        if(!networkModules||!networkModules.length) throw new Error("load network failred!")
        if(!serviceModules||!serviceModules.length||!serviceModules[0].module) throw new Error("load userService failred")

        //execute
        const networks=networkModules.map(m=>m.module);
        const userService=serviceModules[0].module as UserService;
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
        log("#ERROR:%s\n",msg,modules);
        return null;
    }
}