import { ModulePackage } from "../../lib/module-loader/module.interface";
import Network from "../network/network.service";
import deviceRoutes from "./device.route";
import DeviceService from "./device.service";

export default function startDeviceService(infor:ModulePackage,network:any,db:any){
   //1. input & verify
    if(!db)throw new Error("load database error");
    if(!network) throw new Error("load network error")

    //2. execute
    const service=new DeviceService(network,db,deviceRoutes);
    return service; /** success */
}