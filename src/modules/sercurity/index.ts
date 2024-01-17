import SercurityService from "./service";

export default function startup(inf:any,userService:any,driver:any,server:any){
    const sercurity=new SercurityService(server,driver,userService);
    return sercurity;
}