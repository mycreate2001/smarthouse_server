import LocalDatabaseLite from "local-database-lite";
import { join } from "path";
import { createLog } from "../../lib/log";
import { ModuleInfor, ModulePackage } from "../../lib/module-loader/module.interface";
const _PATH=join(__dirname,"..",'..','..','storage',"database.json");//require('../../../storage/database.json')
export default function startup(infor:ModuleInfor,modules:ModulePackage[]){
    //
    const log=createLog(infor.id,"center")
    const path:string=infor.params.path||_PATH
    const db=new LocalDatabaseLite(path);
    log("load success!")
    return db;
}