import DriverService from "./service";

export default function startup(inf:any,server:any,driver:any,db:any){
    if([server,driver,db].some(item=>!item)) throw new Error("submodel is error");
    const service=new DriverService(server,driver,db)
    return service;
}