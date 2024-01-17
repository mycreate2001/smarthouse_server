import UserService from "../user/user.service";
import socketSercurity from "./socket-sercurity.service";
export default function startup(inf:any,socket:any,database:any,userService:UserService,driver:any){
    /** verification */
    if([socket,database,userService].some(item=>!item)) throw new Error("load submodule is failed!");
    /** handle */
    const sercurity=socketSercurity(socket,driver,userService);
    return sercurity;
}