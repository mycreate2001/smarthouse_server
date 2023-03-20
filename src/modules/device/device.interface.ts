export interface DeviceStatus{
    id:string;
    status:number;
}

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
}

export interface Device{
    id:string;
    name:string;
    online:boolean;
    states:string[];
    status:number;
}

