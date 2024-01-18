import SercurityService from "./service";

export default function startup(inf:any,userService:any,driver:any,server:any){
    /** check */
    if([userService,driver,server].some(item=>!item)) throw new Error("input wrong");

    /** execute */
    const sercurity=new SercurityService(server,driver,userService);
    return sercurity;
}