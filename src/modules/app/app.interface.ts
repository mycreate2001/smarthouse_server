import { Device } from "../device/device.interface";

export interface UpdateDevice{
    devices:Device[];
    removes:(Device|string)[]
}