import { DataConnect, toArray } from "local-database-lite";
import tEvent from "../../lib/event";
import { Device, DeviceStatus } from "./device.interface";

export default class DeviceService extends tEvent{
    db:DataConnect<Device>
    constructor(db:DataConnect<Device>){
        super();
        this.db=db;
    }
    add(devices:Device|Device[]){
        const _devices=toArray(devices);
        _devices.forEach(device=>{
            this.db.add(device)
        })
    }
    updateStatus(stts:DeviceStatus|DeviceStatus[]){
        const _stts=toArray(stts);
        _stts.forEach(stt=>{
            return this.db.get(stt.id).then(d=>{
                if(!d) throw new Error("device not exist on db")
                if(d.status!==stt.status){
                    d.status=stt.status;
                    this.emit(stt.id+":"+stt.status);
                }
            })

        })
    }
}