import { DataConnect, LocalDatabaseLite } from "local-database-lite";
import { DeviceServiceData } from "../device/service";
import { Device, _DB_DEVICE } from "../../interface/device.interface";
import { CommonNetwork } from "../../interface/network.interface";
import { ApiHook, ApiServiceInt } from "./api";

export default class ApiService implements ApiServiceInt{
    db:DataConnect<Device>
    deviceService:DeviceServiceData
    server:CommonNetwork
    constructor(db:LocalDatabaseLite,deviceService:DeviceServiceData,server:CommonNetwork,apiHooks:ApiHook[]){
        this.db=db.connect(_DB_DEVICE);
        this.deviceService=deviceService;
        this.server=server;
        this._init(apiHooks)
    }
    getdevices(): Promise<Device[]> {
        throw new Error("Method not implemented.");
    }
      
    private _init(apis:ApiHook[]){
        apis.forEach(api=>{
            this.server.on(api.ref,(client,packet)=>{
                api.handle(client,packet,api,this,this.deviceService)
            })
        })
    }
}