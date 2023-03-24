import { ModulePackage } from "../../lib/module-loader/module.interface";
import UserService from "./user.service";

export default function startupUserService(infor:ModulePackage,userDatabase:any,hash:any){
    //1. check & verify
    if(!userDatabase) throw new Error("load database error")
    if(!hash) throw new Error("load hash is failred!")
    
    //2. execute
    const service=new UserService(userDatabase,hash);
    return service;
}