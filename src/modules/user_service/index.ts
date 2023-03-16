import { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import UserService, { UserData } from "./user.service";

export default function startupUserService(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center");
    //check & verify
    const dbModules=modules.database;
    const hashModules=modules.hash;
    const networkModules=modules.network;
    if(!dbModules||!dbModules.length||!dbModules[0].module){
        log("load user_database is failred!\n\t\t",modules);
        return null;
    }
    if(!hashModules||!hashModules.length||!hashModules[0].module){
        log("load hash is failred!\n\t\t",modules);
        return null;
    }
    if(!networkModules||!networkModules.length){
        log("Load network was failred!\n\t\t",modules);
        return null;
    }

    //execute
    const db=dbModules[0].module as DataConnect<UserData>;//get first database service
    const hash=hashModules[0].module
    const service=new UserService(db,hash);
    const networks=networkModules.map(n=>n.module);
    networks.forEach(network=>{
        network.setAuthenticate(service.authenticate());
    })
    log("load success!");
    return service;
}