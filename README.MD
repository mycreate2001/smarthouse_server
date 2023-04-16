# 1. Communicate
## websocket
- use ws (mpm ws)
- protocol is same mqtt (aedes)
## mqtt (aedes)
- use aedes
- keep origin
## Network
- combine websocket & mqtt
- protocol look same mqtt (aedes)
- can publish throw server (mqtt,websocket)
# 2. Need to do
[local-database]

# 3. Module-level (Ver2)
- easy to add/remove middleware
- total level 1 ~ 10 (level10 is top), level1=lowest level, it's apply for communicate, database,...
- module will load from level 0-->10
- use type "network/websocket
## 3.1 todo
- add module from web [done]
    [handle upload] --> [ zipfile ] --> [ add information]
- edit package infor [notyet]
- remove module from web [notyet]
- publish betwen networks (tasmota & socketservice)- [done]
- revise config => more depth with object 
+ example
[
    [hash]
    test1=100
    [network]
    test2=name
]
=> result={hash:{test1:'100'},network:{test2:'name'}}

# device
+ management by Device as DeviceCommon
+ basic item: 
    id:string;              //id of device
    name:string;            // family name
    linkQuality:number;     // quality of connect
    modelId:string;         // model id
    model:string;           // model name
    ipAddr:string;          // address of device
    mac:string;             // mac 
    fns:string;             // functions list
    type:string;            // it's decide which to remote
    updateList:string[];    // list item can make event when change value

[2023-Apr-16]
-bug mqtt.service.publish not execute by publish function wrong logics