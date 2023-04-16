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

export type DeviceUpdate=(type:DeviceUpdateType,devices:Device[])=>void;
export type DeviceEdit=(idvs:(Partial<Device>&{id:string})[],client:NetworkClient)=>void;
export type DeviceConnect=(online:boolean,client:NetworkClient)=>void;
export type DeviceConfig=(idvs:Device[],client:NetworkClient)=>void;
export type DeviceGetInfor=(idvs:Device[],network:NetworkCommon)=>number;
export type DeviceUpdateBySearch=(keys:string[]|string,idvs:Partial<Device>[],client:NetworkClient)=>void;
export type DeviceAdd=(idvs:Device[])=>void;
export type DeviceOnUpdate=(idvs:(any&{id:string})[])=>void;

export interface DeviceStatus{
    id:string;
    status:number;
}

export type DeviceUpdateType="full"|"update"



/**
 * all device was storage basse on DeviceCommon
 * each module have name/id to device as type
 */
export interface Device{
    id:string;                  //id
    name:string;                // name of device
    linkQuality:number;         // quality of device wifi or zigbee
    modelId:string;             // modelid
    model:string;               // model name
    ipAddr:string;              // address of device
    mac:string;                 // mac or IEEEAddress
    fns:string[];                 // functions
    type:string;/** device type, it's effect to remote device */
    updateList:string[]; //list item will generate event when change value
    online:boolean;     // online status true=online
}


export interface DeviceDb{
    [id:string]:any
}


////////////////// HANDLE TOPICS //////////////////////////
/** export for each handle topic module  */
export type TopicService=TopicServiceClient|TopicServiceServer

export interface TopicServiceClient {
    id:string;                                          // handle module id --> add into device database
    topics:TopicData[];
    type:'client'                                 // each topic & handle
    remote:DeviceRemote; //remote 
    getInf:DeviceGetInfor;
}

export  interface TopicServiceServer{
    id:string;
    topics:TopicData[];
    type:'server'
}


/** topic data include handle */
export interface TopicData{
    id:string;                  // separate with other
    name?:string;               // discription
    ref:string;                 // matching case run or not
    handle:TopicHandle;         // handle event
}
export type DeviceRemote=(idvs:Device[],network:NetworkCommon)=>void; //remote 
export type TopicHandle=(packet:PublishPacket,client:NetworkClient,network:NetworkCommon,service:DeviceService)=>void


export interface TopicServiceDb<T>{
    [id:string]:TopicService
}
