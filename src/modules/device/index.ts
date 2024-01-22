import DriverService from "../driver/service";
import DeviceService from "./service";
import { _DB_DEVICE } from "../../interface/device.interface";
export default function startup(inf:any,drivers:DriverService[],db:any){
    if([drivers,db].some(item=>!item)) throw new Error("submodel is error");
    const device=new DeviceService(drivers,db);
    return device;
}