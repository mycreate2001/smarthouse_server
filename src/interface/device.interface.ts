import { LocalDatabaseLite, LocalDatabaseQuery } from "local-database-lite";
import { CommonNetwork } from "./network.interface";

/** device */
export const _DB_DEVICE='devices'
export interface Device{
    id:string;                  // id
    type:string;                // device type, it's usefull for control example tasmota,socket,mqtt
    name:string                 // family name
    group:string;               // room or group of device
    icon:string;                // icon of device
    values:DeviceValue[];         // device values
    eid:string;                 // equipment id
    model:string;
    address:string;             // ip or mac
    mac:string;
}

export interface DeviceRemote{
    id:string;
    type:string;
    eid:string;
    address:string;
    values:DeviceValue[]
}
// can update from device
export const deviceUpdateList:string[]="address".split(",")

/** must have id */
export interface DeviceBasic extends Partial<Omit<Device,"values">>{
    id:string;
    values?:ValuesBasic[]
}
export interface ValuesBasic{
    id:string;
    value:number;
}

export type DeviceOpt=Partial<Device> &{id:string}


/** device service (common) */
export interface CommonDriverService{
    /** event from device */
    onConnect(eid:string,online:boolean):any;        // handle connect
    onUpdate(devices:DeviceBasic[],label?:string):any;             // update values of device
    onUpdateBySearch(idv:Partial<Device|DeviceBasic>,obj:Partial<Device|DeviceBasic>,label?:string):any;
    /** control */
    remote(idvs:DeviceRemote|DeviceRemote[],network:CommonNetwork,label?:string):any; 
    getServices():CommonDriverList[]                    // get service list for authorization
    nDevices:DeviceBasic[];
    register(idvs:DeviceBasic|DeviceBasic[]):Promise<string[]>;
    getDevices(...queries:LocalDatabaseQuery[]):Promise<Device[]>
}


/** List of device service
 * this data will export key for authorization
 */
export interface CommonDriverList{
    id:string;              // id of service
    name:string;            // Family name of service;
    ref:string;             // ref for service
}

interface DbType<T extends {id:string}>{
    [id:string]:T
}


///////////// values ////////////////
export type DeviceValueIds=keyof typeof deviceValueDefault
// export type DeviceValueDb= DbType<[id:DeviceValueType]:any
export type DeviceValueDb=DbType<DeviceValue>
export const deviceValueDefault:DeviceValueDb={
    power:{
        id:"power",
        type:"list",
        name: "power",
        value: 0,
        isControl: true,
        listNames:["off","on"]
    },
    online:{
        id:"online",
        type:"list",
        name: "online",
        value: 0,
        isControl: true,
        listNames:["offline","online"]
    },
    temp:{
        id:"temp",
        type:"range",
        name: "Temperature",
        value: 0,
        isControl: false,
        range:[0,100]
    },
    humi:{
        id:"humi",
        type:"range",
        name: "Humidity",
        value: 0,
        isControl: false,
        range:[0,100]
    },
    network:{
        id:"network",
        type:"range",
        name: "LinkQuality",
        value: 0,
        isControl: false,
        range:[0,200]
    },
    contact:{
        id:'contact',
        type:'list',
        name:'contact',
        isControl:false,
        listNames:["open","close"],
        value:0
    },
    batt:{
        id:'batt',
        type:'range',
        name:'Battery',
        unit:'%',
        isControl:false,
        range:[0,100],
        value:0
    },
    dimmer:{
        id:'dimmer',
        name:'Dimmer',
        type:'range',
        isControl:false,
        range:[0,200],
        value:0 
    }
}


export type DeviceValue=DeviceValueList|DeviceValueRange

export interface DeviceValueDataCommon{
    id:string;
    name:string;        // family name
    value:any;
    isControl:boolean;      // can control not not
    icon?:string;            // icon of param
}

interface DeviceValueRange  extends DeviceValueDataCommon{
    type:'range';       // type
    range:number[];     // range of value
    step?:number;       // step of each jump
    unit?:string;       // unit
}

interface DeviceValueList extends DeviceValueDataCommon{
    type:'list';            // type
    listNames:string[];     // list name
}
