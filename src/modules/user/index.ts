import { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import { ModulePackage } from "../../lib/module-loader/module.interface";
import Cryption from "../cryption/cryption";
import UserService, { UserData } from "./user.service";

export default function startupUserService(infor:ModulePackage,userDatabase:DataConnect<UserData>,hash:Cryption){
    const log=createLog(infor.id,"center");
    try{
        //check & verify
        if(!userDatabase) throw new Error("load database error")
        if(!hash) throw new Error("load hash is failred!")
        //execute
        const service=new UserService(userDatabase,hash);
        
        log("load success!");
        return service;

    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error";
        log("### ERROR:%s\n",msg);
        return null;
    }
}