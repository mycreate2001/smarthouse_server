import ApiService from "./service";
import apis from "./api";
export default function startup(inf:any,db:any,deviceService:any,network:any){
    /** check condition */
    if([db,deviceService,network].some(item=>!item)) throw new Error("load submodel is error");

    /** execute */
   const service=new ApiService(db,deviceService,network,apis)
   return service;
}