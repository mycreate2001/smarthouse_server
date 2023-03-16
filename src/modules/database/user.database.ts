import { createLog } from "../../lib/log";
import { InputModule, ModuleInfor } from "../../lib/module-loader/module.interface";
export default function startup(infor:ModuleInfor,modules:InputModule){
    const log=createLog(infor.id,"center")
    const dbs=modules["database"];
    if(!dbs||!dbs.length) {
        log("### ERROR: loading failred!")
        return null;//error
    }
    const userDb=dbs[0].module.connect("users");
    log("loaded successfully");
    return userDb;
}