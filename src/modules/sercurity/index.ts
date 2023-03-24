import { ModulePackage } from "../../lib/module-loader/module.interface";
import UserService from "../user/user.service";
import Sercurity from "./sercurity.service";
export default function startup(infor:ModulePackage,networks:any[],userService:UserService){
    //1. input & verify
    if(!networks||!networks.length) throw new Error("load network failred!")
    if(!userService) throw new Error("load userService failred")

    // 2. execute
    const sercurity=new Sercurity(userService);
    networks.forEach(network=>{
        network.authenticate=sercurity.authenticate;
        network.authorizePublish=sercurity.authorizePublish;
        network.authorizeSubscribe=sercurity.authorizeSubscribe
    })
    return 1;//
}