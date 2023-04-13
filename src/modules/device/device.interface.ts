import { PublishPacket } from 'packet';
import {NetworkClient, NetworkCommon} from '../network/network.interface'
import DeviceService from './device.service';

export interface DeviceServiceBase{
    remote:DeviceRemote;            // remote clients (devices)
    sendUpdate:DeviceUpdate;        // update to controller (apps)
    onEdit:DeviceEdit;              // handle event when get edit from app/client
    onConnect:DeviceConnect;        // handle event device connect/disconnect
    onConfigure:DeviceConfig;       // handle device get config event
    getInfor:DeviceGetInfor;        // request infor from server
    updateBySearch:DeviceUpdateBySearch;  //update by search networkid
    add:DeviceAdd; 
    publish:(packet:PublishPacket)=>void;                 // add new device
    /** handle update status event*/
    onUpdate:DeviceOnUpdate;    //handle update status event
}

export type DeviceRemote=(stt:DeviceStatus[])=>void;
export type DeviceUpdate=(type:DeviceUpdateType,devices:Device[])=>void;
export type DeviceEdit=(idvs:(Partial<Device>&{id:string})[],client:NetworkClient)=>void;
export type DeviceConnect=(online:boolean,client:NetworkClient)=>void;
export type DeviceConfig=(idvs:Device[],client:NetworkClient)=>void;
export type DeviceGetInfor=(deviceId:string,client:NetworkClient)=>void;
export type DeviceUpdateBySearch=(keys:string[]|string,idvs:Partial<Device>[],client:NetworkClient)=>void;
export type DeviceAdd=(idvs:Device[])=>void;
export type DeviceOnUpdate=(idvs:(any&{id:string})[])=>void;

export interface DeviceStatus{
    id:string;
    status:number;
}

export type DeviceUpdateType="full"|"update"

export interface Equipment{
    id:string;              // id == mac
    name:string;            // device name
    names:string[]          // family name of all device
    ipAddr:string;              // ipaddress
    mac:string;             // mac
    model:string;           // model
    fns:string[];        // states of all device
    version:string;
    online:boolean;
}

export interface Device{
    id:string;
    name:string;
    online:boolean;
    fns:string[];
    status:number;
    model:string;
    ipAddr:string;
    mac:string;         //mac or IEEEAddress
}

export interface DeviceCommon{
    id:string;
    name:string;
    linkQuality:number;
    modelId:string;
    model:string;
    ipAddr:string;
    mac:string;
    fns:string;//functions
}

export interface DeviceOnOff extends DeviceCommon{
    type:'ONOFF'
    power:number;//0=off,1=on
}

export interface DeviceZigbeeTemp extends DeviceCommon{
    type:'ZigbeeTemp'
    temporature:number;
    humindity:number;
}




export interface DeviceDb{
    [id:string]:Device
}


/** handle */
export interface TopicService{
    id:string;
    name?:string;
    ref:string;
    handle:TopicHandle;
}
export type TopicHandle=(packet:PublishPacket,client:NetworkClient,network:NetworkCommon,service:DeviceService)=>void

export interface TopicServiceDb{
    [id:string]:TopicService
}
