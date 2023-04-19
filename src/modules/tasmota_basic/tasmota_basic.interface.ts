import { Device, Equipment } from "../device/device.interface";
import { DatabaseType } from '../../lib/temporary-database/interface'
export interface DeviceTasmotaBasic extends Device{
    status:number;  //0=OFF, 1=ON
    value:number;
    eid:string;
}

export interface ModelData{
    [id:string]:UpdateListType[]
}

export type UpdateListType="status"|"value" 
type TasmotaInforHandle=(obj:any,eid:string)=>any

export interface TasmotaBasicQuipment extends Equipment{
    fns:UpdateListType[];
}

export type InforHandle=(obj:any,eid:string)=>InforHandleResult[]|undefined;
export type InforHandleDb=DatabaseType<InforHandle>
export type InforHandleResult =Partial<DeviceTasmotaBasic> &{id:string}