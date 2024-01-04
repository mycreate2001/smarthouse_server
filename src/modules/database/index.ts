import LocalDatabaseLite from "local-database-lite";
import { ModulePackage } from "module-loader/interface";
import { join } from "path";
const _PATH=join(__dirname,"..",'..','..','storage',"database.json");
export default function startup(infor:ModulePackage){
    //1. input & verify
    const path:string=infor.params.path||_PATH

    //2. execute
    const db=new LocalDatabaseLite(path);
    return db;
}