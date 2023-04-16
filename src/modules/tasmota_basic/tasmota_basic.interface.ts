import { Device } from "../device/device.interface";
export interface DeviceTasmotaBasic extends Device{
    status:number;  //0=OFF, 1=ON
    eid:string;
}