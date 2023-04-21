import { DeviceTasmotaBasic, InforHandleDb, ModelData, TasmotaBasicQuipment } from "./tasmota_basic.interface";
import { DeviceStatus } from "../device/device.interface";

//{"Time":"2023-04-17T14:26:44","Uptime":"0T00:00:10",
//"UptimeSec":10,"Heap":25,"SleepMode":"Dynamic","Sleep":10,
//"LoadAvg":82,"MqttCount":1,"POWER":"ON","Dimmer":42,"Fade":"OFF",
//"Speed":1,"LedTable":"ON",
//"Wifi":{"AP":1,"SSId":"smarthouse","BSSId":"0A:6A:C5:7B:F1:38","Channel":6,"Mode":"11n","RSSI":100,"Signal":-27,"LinkCount":1,"Downtime":"0T00:00:05"}}

export const InforHandles:InforHandleDb={
    status(obj: any, eid: string): {id:string,status:number}[]|undefined {
        const outs: DeviceStatus[] = []
        Object.keys(obj).forEach(key => {
            if (!key.startsWith("POWER")) return;// other case
            // extract infor
            const a = key.substring(key.length - 1);//
            const id = parseInt(a) || 1
            const status = (obj[key] + "").toUpperCase() == "ON" ? 1 : 0
            outs.push({ id: eid + "@" + id, status })
        })
        return outs
    },
    value(obj:any,eid:string):{id:string,value:number}[]{
        const outs:{id:string,value:number}[]=[]
        Object.keys(obj).forEach(key=>{
            //check condition
            if(!key.toLowerCase().startsWith("dimmer")) return;
            const a=key.substring(key.length-1);//last char
            const id=parseInt(a)||1
            const value=parseInt(obj[key]);
            outs.push({id:eid+'@'+id,value})
        })
        //correct value
        return outs
    }
}

//obj={"ip":"192.168.137.22","dn":"Tasmota","fn":["Tasmota",null,null,null,null,null,null,null],"hn":"E8DB8494B051-4177","mac":"E8DB8494B051","md":"PWM Dimmer","ty":0,"if":0,"ofln":"Offline","onln":"Online","state":["OFF","ON","TOGGLE","HOLD"],"sw":"12.4.0.5","t":"E8DB8494B051","ft":"%prefix%/%topic%/","tp":["cmnd","stat","tele"],"rl":[2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"swc":[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],"swn":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"btn":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"so":{"4":0,"11":0,"13":0,"17":0,"20":0,"30":0,"68":0,"73":0,"82":0,"114":0,"117":0},"lk":1,"lt_st":1,"sho":[0,0,0,0],"sht":[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],"ver":1}
export function getEquipment(obj:any,type:string):(TasmotaBasicQuipment|undefined){
    if(!obj||!Object.keys(obj).length) return ;
    const model=obj.md;
    const equipment:TasmotaBasicQuipment={
        id:obj.mac,
        model:model,
        fns:models[model]
    }
    return equipment;
}

export function getDevice(payload:string,type:string):DeviceTasmotaBasic[]{
    const devices:DeviceTasmotaBasic[]=[];
    const obj=JSON.parse(payload);
    const equipment={
        id:obj.mac as string,
        name:obj.dn as string,
        names:obj.fn as string[],
        ipAddr:obj.ip,
        mac:obj.mac as string,
        model:obj.md as string,
        fns:obj.state as string[],
        version:obj.sw as string,
        online:true,
    }
    equipment.names.forEach((name,pos)=>{
        if(!name) return;
        const newDevice:DeviceTasmotaBasic={
            id:equipment.id+"@"+(pos+1),
            name,
            online:equipment.online,
            status:0,
            model:equipment.model,
            ipAddr:equipment.ipAddr,
            mac:equipment.mac,
            linkQuality:0,
            modelId:equipment.model,
            type,
            updateList:["status"],
            eid:equipment.mac,
            value:0,
        }
        devices.push(newDevice)
    })
    return devices
}


const models:ModelData={
    "Sonoff Basic":["status"],
    "Sonoff T1 3CH":["status"],
    "PWM Dimmer":["status","value"],
    "Sonoff Dual":["status"],
    "Sonoff TH":["status"],
    "Sonoff 4CH":["status"],
    "Sonoff 4CH Pro":["status"],
    "Sonoff ZbBridge":["value"]
}

