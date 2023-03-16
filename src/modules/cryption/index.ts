import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import Cryption from "./cryption";
const _MAIN_KEY="thanhIM"
export default function CryptionStatup(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id.toUpperCase(),"center")
    const _paramsKey=(infor.params && infor.params.key)?infor.params.key:_MAIN_KEY
    const configModule=modules.config;
    if(!configModule||!configModule.length) {
        log("##### ERROR[1]: Loading error");
        return null;
    }
    const config=configModule[0].module;
    if(!config){
        log("#### ERROR[2]: database wrong");
        return null;
    }
    const key=config._MAIN_KEY||_paramsKey
    console.log("+++ cryption/index.ts key:",key);
    const cryption=new Cryption(key);
    return cryption;
}