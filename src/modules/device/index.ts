import DriverService from "../driver/service";
import DeviceService from "./service";

export default function startup(inf:any,drivers:DriverService[]){
    const device=new DeviceService(drivers);
    return device;
}