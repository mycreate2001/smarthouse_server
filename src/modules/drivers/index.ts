import DriverService from "./service";

export default function startup(inf:any,drivers:any[]){
    const globalDrivers=new DriverService(drivers);
    return globalDrivers;
}