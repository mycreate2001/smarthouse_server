import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import { ModuleInfor } from "../../lib/module-loader/module.interface";
export default function startup(infor:ModuleInfor,database:LocalDatabaseLite){
    const log=createLog(infor.id,"center")

    try{
        /** 1. Input & verify */
        if(!database) throw new Error("database error")
        const db=database.connect("users");
        log("load success!");
        return db;

    }
    catch(err){
        const msg=err instanceof Error?err.message:"other error"
        log("### ERROR: %s",msg);
        return null
    }
}