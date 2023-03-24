import { ModulePackage } from "../../lib/module-loader/module.interface";
import Network from "../network/network";
import DeviceService from "./device.service";

export default function startDeviceService(infor:ModulePackage,db:any,network:Network){
   //1. input & verify
    if(!db)throw new Error("load database error");
    if(!network) throw new Error("load network error")

    //2. execute
    const service=new DeviceService(db);
    // console.log("\n++++ device.index.ts \nnetwork:",network);
    network.onConnect=service.onConnect;
    network.onUpdate=service.onUpdate;
    network.onConfigure=service.onConfigure;
    network.update();
    return service; /** success */
}