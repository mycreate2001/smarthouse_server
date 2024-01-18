import { createLog } from "advance-log";
import { CommonDriverList, CommonDriverService, Device, DeviceOpt, _DB_DEVICE } from "../../interface/device.interface";

import { DriverHook, DriverPacket } from "../../interface/driver.interface";
import { CommonNetwork } from "../../interface/network.interface";
import { DataConnect, LocalDatabaseLite } from "local-database-lite";

const _LABEL="driver"
const log=createLog(_LABEL,{enablePos:true})

export default class DriverService implements CommonDriverService{
    server:CommonNetwork
    db:DataConnect<Device>
    // driver:DriverServiceData;
    type:string=''
    constructor(server:CommonNetwork,driver:DriverPacket,db:LocalDatabaseLite){
        this.server=server;
        this.db=db.connect(_DB_DEVICE);
        // this.driver=driver.services;
        this.type=driver.type;      //type as tasmota, websocket,...
        this._initialDriver(driver.services)
    }
    update=(devices: DeviceOpt[])=> {
        log("### WARNING: 'update' not be handle")
    }
    private _initialDriver(drivers:DriverHook[]){
        drivers.forEach(driver=>{
            this.server.on(driver.ref,(client,packet)=>{
                driver.handler(client,packet,driver,this)
            })
        })
    }
    connect=(eid: string, online: boolean)=>{
        log("### WARNING: 'connect' not be handle")
    };
    remote=(device: Device)=>{
        log("### WARNING: 'remote' not be handle")
    }
    getServices(): CommonDriverList[] {
        throw new Error("Method not implemented.");
    }
    

}
