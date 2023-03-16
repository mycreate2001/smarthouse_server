import { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import { InputModule, ModuleInfor } from "../../lib/module-loader/module.interface";
import { UserData } from "../user_service/user.service";
export default function startup(infor:ModuleInfor,modules:InputModule){
    const log=createLog(infor.id,"center")
    const dbs=modules["database"];
    if(!dbs||!dbs.length||!dbs[0].module) {
        log("### ERROR[1]: loading failred!")
        return null;//error
    }
    const db=dbs[0].module.connect("users");
    log("load success!");
    return db;
}