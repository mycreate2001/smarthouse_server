import { createLog } from "advance-log";
import { CommonDriverList, CommonDriverService, Device, DeviceBasic, DeviceOpt, _DB_DEVICE } from "../../interface/device.interface";

import { DriverHook, DriverPacket } from "../../interface/driver.interface";
import { CommonNetwork } from "../../interface/network.interface";
import { DataConnect, LocalDatabaseLite, LocalDatabaseQuery } from "local-database-lite";

const _LABEL="driver"
const log=createLog(_LABEL,{enablePos:true})

export default class DriverService implements CommonDriverService{
    server:CommonNetwork
    type:string=''
    services:DriverHook[]=[]
    constructor(server:CommonNetwork,driver:DriverPacket){
        this.server=server;
        this.type=driver.type;      //type as tasmota, websocket,...
        this._initialDriver(driver.services);
        this.services=driver.services;
    }
    
    onUpdateBySearch=(idv: Partial<Device>, ...queries: LocalDatabaseQuery[]) => {
        log("### WARNING: 'update' not be handle")
    }
    onUpdate=(device: DeviceBasic[])=> {
        log("### WARNING: 'update' not be handle")
    }
    private _initialDriver(drivers:DriverHook[]){
        drivers.forEach(driver=>{
            this.server.on(driver.ref,(client,packet)=>{
                driver.handler(client,packet,driver,this)
            })
        })
    }
    onConnect=(eid: string, online: boolean)=>{
        log("### WARNING: 'connect' not be handle")
    };
    remote=(device: Device)=>{
        log("### WARNING: 'remote' not be handle")
    }
    getServices(): CommonDriverList[] {
        return this.services
    }
    
    register(idvs: DeviceOpt[]){
        log("### WARING: register not implemented")
    }
}
