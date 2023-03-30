import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import { createLog } from "advance-log";
import { ModulePackage } from "../../lib/module-loader/module.interface";
export default function startup(infor:ModulePackage,database:LocalDatabaseLite){
    /** 1. Input & verify */
    if(!database) throw new Error("database error")
    /** 2. execute */
    const db=database.connect("users");
    return db;
}