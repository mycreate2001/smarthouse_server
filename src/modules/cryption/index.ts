import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import Cryption from "./cryption";
const _MAIN_KEY="thanhIM"
export default function CryptionStatup(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center")
    const _paramsKey=(infor.params && infor.params.key)?infor.params.key:_MAIN_KEY
    const configModule=modules.config;
    if(!configModule||!configModule.length) {
        log("##### ERROR[1]: Loading error\n\t\t",modules);
        return null;
    }
    const config=configModule[0].module;
    if(!config){
        log("#### ERROR[2]: database wrong\n\t\t",modules);
        return null;
    }
    const key=config.obj._MAIN_KEY||_paramsKey
    const cryption=new Cryption(key);

    log("load success!")
    return cryption;
}