import UserService from "../user/user.service";
import SercurityService from "./service";
export default function startup(infor:any,networks:any[],userService:UserService,db:any){
    //1. input & verify
    if(!networks||!networks.length) throw new Error("load network failred!")
    if(!userService) throw new Error("load userService failred")
    if(!db) throw new Error("sercurity_database error")
    // 2. execute
    const sercurity=new SercurityService(userService);
    networks.forEach(network=>{
        network.authenticate=sercurity.authenticate;
        network.authorizePublish=sercurity.authorizePublish;
        network.authorizeSubscribe=sercurity.authorizeSubscribe
    })
    //3. return
    return sercurity;//
}