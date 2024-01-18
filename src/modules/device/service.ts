import { createLog } from "advance-log";
import { CommonDriverList, CommonDriverService, Device, DeviceOpt } from "../../interface/device.interface";
import DriverService from "../driver/service";
const _LABEL="device"
const log=createLog(_LABEL,{enablePos:true})
export default class DeviceService implements CommonDriverService{
    drivers:DriverService[]=[]
    constructor(drivers:DriverService[]){
        this.drivers=drivers;
        this.drivers.forEach(driver=>{
            driver.connect=this.connect;
            driver.update=this.update;
            
        })
    }
    remote(device: Device): void {
         this.drivers.map(driver=>driver.remote(device))
    }
    update(devices: DeviceOpt[]): void {
        
    }
    getServices(): CommonDriverList[] {
        return this.drivers.reduce((acc:CommonDriverList[],cur)=>{
            const _cur=cur.getServices();
            return [...acc,..._cur]
        },[])
    }
    connect(eid:string,online:boolean){
        log("OK nhe")
    }
}