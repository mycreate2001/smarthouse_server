import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import Cryption from "./cryption";
const _MAIN_KEY="thanhIM"
export default function CryptionStatup(infor:ModulePackage,setting:any){
    const log=createLog(infor.id,"center")
    try{
        /** input & verify */
        const _paramsKey=(infor.params && infor.params.key)?infor.params.key:_MAIN_KEY
        if(setting==null)
            throw new Error("load setting error");
        const key=setting.obj._MAIN_KEY||_paramsKey
        const cryption=new Cryption(key);
        log("load success!")
        return cryption;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        log("##ERROR: %s",msg);
        return null
    }
}