import { join } from "path";
import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import Config from "./configs";
const _PATH_DEFAULT=join(__dirname,"..","..","..","configure.ini");//require('../../../config.ts')
export default function startupConfig(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center")
    const path:string=(infor.params.path)?infor.params.path:_PATH_DEFAULT
    const configs=new Config({path});
    log("load success!")
    return configs;
}