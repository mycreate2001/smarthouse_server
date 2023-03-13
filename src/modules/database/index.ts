import LocalDatabaseLite from "local-database-lite";
import { join } from "path";
import { ModuleInfor, ModulePackage } from "../../interface";
const _PATH=join(__dirname,"..",'..',"database.json")
export default function startup(infor:ModuleInfor,modules:ModulePackage[]){
    console.log("******* HERE *******")
    const path=(infor && infor.params && infor.params.path)?infor.params.path:_PATH
    const db=new LocalDatabaseLite(path)
    return db;
}