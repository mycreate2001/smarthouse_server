import { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import UserService, { UserData } from "./user.service";

export default function startupUserService(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center");
    //check & verify
    try{
        const mDatabase=modules.database;
        const mHash=modules.hash;
        if(!mDatabase||!mDatabase.length||!mDatabase[0].module)
            throw new Error("load database error")
        if(!mHash||!mHash.length||!mHash[0].module)
            throw new Error("load hash is failred!")


        //execute
        const db=mDatabase[0].module as DataConnect<UserData>;//get first database service
        const hash=mHash[0].module
        const service=new UserService(db,hash);
        
        log("load success!");
        return service;

    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error";
        log("### ERROR:%s\n",msg,modules);
        return null;
    }
}