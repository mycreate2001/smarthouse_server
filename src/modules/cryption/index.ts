import {  ModulePackage } from "../../lib/module-loader/module.interface";
import Cryption from "./cryption";
const _MAIN_KEY="thanhIM"
export default function CryptionStatup(infor:ModulePackage,setting:any){
    //1. input & verify
    const _paramsKey=(infor.params && infor.params.key)?infor.params.key:_MAIN_KEY
    if(setting==null)
        throw new Error("load setting error");

    //2. execute
    const key=setting.obj._MAIN_KEY||_paramsKey
    const cryption=new Cryption(key);
    return cryption;
}