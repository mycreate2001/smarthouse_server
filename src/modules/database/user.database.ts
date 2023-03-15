import { ModuleInfor, ModulePackage } from "../../lib/module/module.interface";
import { toArray } from "../../lib/utility";

export default function startup(infor:ModuleInfor,modules:ModulePackage[]){
    console.log("userDatabase start !!!!!");
    const dbModule=modules.find(m=>m.type=='database');
    if(!dbModule) return null;//error
    const userDb=dbModule.module.connect("users")
    return userDb;
}