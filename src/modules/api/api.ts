import { createLog } from "advance-log";
import { CommonClient, Packet } from "../../interface/network.interface";
import { DeviceServiceData } from "../device/service";
import { Device } from "../../interface/device.interface";
const _LABEL="API"
const log=createLog(_LABEL,{enablePos:true})
const apis:ApiHook[]=[
    {
        id:'devices',
        name:"get device",
        ref:'api/:id/request',
        handle(client, packet, inf, aipService, device) {
            log("ok ban nhe")
        },
    }
]

export interface ApiHook{
    id:string;              // api uniquie
    name?:string;           // name of api
    ref:string;             // topic
    handle:(
        client:CommonClient,
        packet:Packet,
        inf:ApiHook,
        aipService:ApiServiceInt,
        device:DeviceServiceData
    )=>void;
}

export default apis

export interface ApiServiceInt{
    getdevices():Promise<Device[]>
}