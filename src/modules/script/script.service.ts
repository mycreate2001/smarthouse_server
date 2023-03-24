import { DataConnect } from "local-database-lite";
import DeviceService from "../device/device.service";
import { ScriptData } from "./script.interface";

export class Script{
    db:DataConnect<ScriptData>
    service:DeviceService
    constructor(db:DataConnect<ScriptData>,deviceService:DeviceService){
        this.db=db
        this.service=deviceService;
    }

}