import { createLog } from "../../lib/log";
import { InputModule, ModuleInfor } from "../../lib/module-loader/module.interface";
export default function startup(infor:ModuleInfor,modules:InputModule){
    const log=createLog(infor.id,"center")
    const mDatabase=modules.database;
    if(!mDatabase||!mDatabase.length||!mDatabase[0].module) {
        log("### ERROR[1]: loading failred!")
        return null;//error
    }
    const db=mDatabase[0].module.connect("devices");
    log("load success!");
    return db;
}