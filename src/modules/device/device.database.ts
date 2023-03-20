import LocalDatabaseLite from "local-database-lite";
import { createLog } from "../../lib/log";
import { ModuleInfor } from "../../lib/module-loader/module.interface";
export default function startup(infor:ModuleInfor,database:LocalDatabaseLite){
    const log=createLog(infor.id,"center")
    try{
        /** input & check */

        if(!database) throw new Error("database error")
        const db=database.connect("devices");
        log("load success!");
        return db;
    }
    catch(err){
        log("### ERROR:%s",err instanceof Error?err.message:"other error")
    }
}