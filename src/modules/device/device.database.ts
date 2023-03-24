import LocalDatabaseLite from "local-database-lite";
import { createLog } from "../../lib/log";
import { ModulePackage } from "../../lib/module-loader/module.interface";
export default function startup(infor:ModulePackage,database:LocalDatabaseLite){
    //1. input & verify
    if(!database) throw new Error("database error")

    //2. execute
    const db=database.connect("devices");
    return db;
}