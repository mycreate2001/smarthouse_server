import { ModulePackage } from "../../lib/module-loader/module.interface";
import UserService from "../user/user.service";
import Sercurity from "./sercurity.service";
export default function startup(infor:ModulePackage,networks:any[],userService:UserService,db:any){
    //1. input & verify
    if(!networks||!networks.length) throw new Error("load network failred!")
    if(!userService) throw new Error("load userService failred")
    if(!db) throw new Error("sercurity_database error")
    // 2. execute
    console.log("\n\n+++ sercurity/index.ts-10 ",{db})
    const sercurity=new Sercurity(userService,db);
    networks.forEach(network=>{
        network.authenticate=sercurity.authenticate;
        network.authorizePublish=sercurity.authorizePublish;
        network.authorizeSubscribe=sercurity.authorizeSubscribe
    })
    //3. return
    return 1;//
}