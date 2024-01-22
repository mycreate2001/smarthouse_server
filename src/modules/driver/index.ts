import DriverService from "./service";

export default function startup(inf:any,server:any,driver:any){
    if([server,driver].some(item=>!item)) throw new Error("submodel is error");
    const service=new DriverService(server,driver)
    return service;
}