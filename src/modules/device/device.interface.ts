import { PublishPacket } from 'packet';
import {NetworkClient, NetworkCommon} from '../network/network.interface'
import DeviceService from './device.service';
import { DataConnect, LocalDatabaseQuery } from 'local-database-lite';

export interface DeviceServiceBase{
    /** variable */
    db:DataConnect<Device>;
    network:NetworkCommon;

    /** remote device from server */
    remote:DeviceRemote;            
    
    /** send update devices to apps from server */
    sendUpdate:DeviceSendUpdate;  
    
    /** publish message from server, pass sercurity */
    publish:(packet:PublishPacket)=>void;
    
    /** get request devices infor from server */    
    getInfor:DeviceGetInfor;

    /** handler Edit devices from app */
    edit:DeviceEdit; 

    /** delete devices */
    delDevice:DeviceDelete;

    /** update device */     
    updateBySearch:DeviceUpdateBySearch;  

    /** update devices from database only*/
    update:DeviceUpdate;    //handle update status event
    
    //// HANDLE EVENTS //////////////
    /** handler new client connect to server */
    onConnect:DeviceOnConnect; 

}

/** main functions */
export type DeviceDelete=(idvs:(Device|string)[])=>Promise<string[]>;//delete success device list
export type DeviceSendUpdate=(type:DeviceUpdateType,devices:Device[])=>void;
export type DeviceEdit=(idvs:(Partial<Device>&{id:string})[])=>Promise<Device[]>;
export type DeviceOnConnect=(online:boolean,client:NetworkClient)=>void;
export type DeviceConfig=(idvs:Device[],client:NetworkClient)=>void;
export type DeviceGetInfor=(idvs:Device[],network:NetworkCommon)=>number;
export type DeviceUpdateBySearch=(idvs:Partial<Device>[],searchKeys:string[])=>Promise<string[]>;
export type DeviceAdd=(idvs:Device[])=>void;
export type DeviceUpdate=(idvs:(Partial<Device>&{id:string})[],udateList?:string[])=>Promise<string[]>;
export type DeviceRemote=(idvs:Device[],network:NetworkCommon)=>string[]; //remote 

export interface DeviceUpdateBySearchData{
    queries:LocalDatabaseQuery
    update:Partial<Device>
}
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
    module:string;      // type of device
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

export type TopicHandle=(packet:PublishPacket,client:NetworkClient,network:NetworkCommon,service:DeviceService)=>void


export interface TopicServiceDb<T>{
    [id:string]:TopicService
}


export interface ChangeData{
    key:string;
    oldVal:any;
    newVal:any;
}