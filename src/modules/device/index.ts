import { CommonDriverService } from "../../interface/device.interface";
import DriverService from "./service";

export default function startup(inf:any,drivers:any[],networks:any[],database:any):CommonDriverService{
    /** check inputs */
    if([drivers,networks,database].some(item=>!item)) throw new Error("some submodules is error");

    /** execute */
    const service=new DriverService(drivers,networks,database);
    console.log("\n\n**** TEST ***");
    getProperty(service);
    return service;
}

function getProperty(abc:any){
    const list=Object.getOwnPropertyNames(abc)
    console.log(list);
}

