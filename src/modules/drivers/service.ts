import { createDebug } from "advance-log";
import { CommonDriverList, CommonDriverService, Device } from "../../interface/device.interface";
const debug=createDebug("driver service",1)
export default class DriverService implements CommonDriverService{
    drivers:CommonDriverService[]
    constructor(drivers:CommonDriverService[]){
        this.drivers=drivers;
        debug(1,"services ",this.getServices())
    }
    remote(device: Device): void {
        this.drivers.forEach(driver=>driver.remote(device))
    }
    update(device: Device): void {
        this.drivers.forEach(driver=>driver.update(device))
    }
    getServices(): CommonDriverList[] {
        // const list=this.drivers.reduce<CommonDriverList[]>((acc,cur,pos)=>{
        //     debug(1,"get service %d ",pos,{acc,cur:cur.getServices()})
        //     return [...acc,...cur.getServices().map(x=>Object.assign(x,{pos}))]
        // },[]);
        // return list;
        return []
    }

}