import { DataConnect, LocalDatabaseLite } from "local-database-lite";
import SocketService, { SocketExt } from "../socket-service/socket.service";
import { CommonDriverList, CommonDriverService, Device, DeviceValueData } from "../../interface/device.interface";
import { Packet } from "../../interface/network.interface";
import { createDebug } from "advance-log";

const debug=createDebug("socket driver",1)
const _CONNECT_REF="device/:eid/connect"
export const SocketDriverservices:SocketServiceData={
    connect:{
        ref:_CONNECT_REF,
        name:"connect",
        handle(ws, packet, service, ref) {
            debug(1,"runing well!");
        },
    }
}

export default class SocketDriver implements CommonDriverService{
    db:DataConnect<Device>
    server:SocketService;
    constructor(opts:SocketDriverOptions){
        this.server=opts.server;
        this.db=opts.db;
        initSocketDriver(SocketDriverservices,this.server);
    }

    /** remove value of device */
    remote(device: Device): void {
        throw new Error("Method not implemented.");
    }

    /** update status of device */
    update(device: Device): void {
        throw new Error("Method not implemented.");
    }

    /** get services */
    getServices(): CommonDriverList[] {
         return Object.keys(SocketDriverservices).map(id=>{
            const {name,ref}=SocketDriverservices[id];
            return {id,name,ref}
        })
    }

}




function initSocketDriver(drivers:SocketServiceData,server:SocketService){
    Object.keys(drivers).forEach(key=>{
        const driver=drivers[key];
        server.on(driver.ref,(ws:any,packet:any)=>{
            driver.handle(ws,packet,server,driver.ref)
        })
    })
}

export interface SocketDriverOptions{
    db:DataConnect<Device>;   // database
    server:SocketService;
}

interface SocketServiceData{
    [id:string]:{
        name:string;        // family name
        ref:string;         // path /ref for toptic
        handle:(ws:SocketExt,packet:Packet,service:SocketService,ref:string)=>any;
    }
}


