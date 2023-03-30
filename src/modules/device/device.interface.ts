import { PublishPacket } from 'packet';
import {Networkclient} from '../network/network.interface'

export interface DeviceServiceBase{
    remote:DeviceRemote;            // remote clients (devices)
    update:DeviceUpdate;            // update to controller (apps)
    onEdit:DeviceEdit;              // handle event when get edit from app/client
    onConnect:DeviceConnect;        // handle event device connect/disconnect
    onConfigure:DeviceConfig;       // handle device get config event
    getInfor:DeviceGetInfor;        // request infor from server
    updateByNetworkId:DeviceUpdateByNetworkId;  //update by search networkid
    add:DeviceAdd; 
    publish:(packet:PublishPacket)=>void;                 // add new device
}

export type DeviceRemote=(stt:DeviceStatus[])=>void;
export type DeviceUpdate=(type:DeviceUpdateType,devices:Device[])=>void;
export type DeviceEdit=(idvs:(Partial<Device>&{id:string})[],client:Networkclient)=>void;
export type DeviceConnect=(online:boolean,client:Networkclient)=>void;
export type DeviceConfig=(idvs:Device[],client:Networkclient)=>void;
export type DeviceGetInfor=(deviceId:string,client:Networkclient)=>void;
export type DeviceUpdateByNetworkId=(idvs:any&{networkId:string},client:Networkclient)=>void;
export type DeviceAdd=(idvs:Device[])=>void;

export interface DeviceStatus{
    id:string;
    status:number;
}

export type DeviceUpdateType="full"|"update"

export interface Equipment{
    id:string;              // id == mac
    name:string;            // device name
    names:string[]          // family name of all device
    ip:string;              // ipaddress
    mac:string;             // mac
    model:string;           // model
    states:string[];        // states of all device
    version:string;
    online:boolean;
    networkId:string;
}

export interface Device{
    id:string;
    name:string;
    online:boolean;
    states:string[];
    status:number;
    model:string;
    networkId:string;
}

export interface DeviceBasic{
    id:string;
    linkQuality:number;
    modelId:string;
    model:string;
    address:string;
}

export interface DeviceOnOff extends DeviceBasic{

}

export interface DeviceDb{
    [id:string]:Device
}


/** handle */
export interface DeviceRoute{
    name:string;
    ref:string;
    handle:DeviceHandle;
}
export type DeviceHandle=(packet:PublishPacket,client:Networkclient,service:DeviceServiceBase)=>void
