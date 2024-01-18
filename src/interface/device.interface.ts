
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
}

/** must have id */
export type DeviceOpt =Partial<Device>&{id:string}

/** device service (common) */
export interface CommonDriverService{
    connect:(eid:string,online:boolean)=>void;        // handle connect
    remote:(device:Device)=>void;                     // remote device
    // onUpdate(id:string,value:DeviceValueData):void; // update status of device
    update:(devices:DeviceOpt[])=>void;                     // update values of device
    getServices():CommonDriverList[]                // get service list for authorization

}


/** List of device service
 * this data will export key for authorization
 */
export interface CommonDriverList{
    id:string;              // id of service
    name:string;            // Family name of service;
    ref:string;             // ref for service
}

interface DbType<T>{
    [id:string]:T
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