// import LocalDatabaseLite from "local-database-lite";
import { LocalDatabaseLite } from "local-database-lite";
import { ModulePackage } from "module-loader/interface";
const _PATH='storage/database.json';
export default function startup(infor:ModulePackage){
    //1. input & verify
    const path:string=infor.params.path||_PATH
    const _paths:string[]=path.split("/");

    //2. execute
    const db=new LocalDatabaseLite(..._paths)
    return db;
}