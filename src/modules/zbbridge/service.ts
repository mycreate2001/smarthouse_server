import { createLog } from "advance-log";
import { DataOptionWithId } from "../../lib/temporary-database/interface";
import { getList, getParams } from "../../lib/utility";
import { Device, DeviceGetInfor, DeviceRemote, DeviceServiceBase, TopicData, TopicService } from "../device/device.interface";
import { createPacket } from "../network/network.service";


const _STATUS_GET_ADDRESS_LIST=[30,34]
const _DATA_TYPE="zigbee"
export interface Sensor extends Device{
    shortAddr:string;
}
const log=createLog("ZbBridge","center")
export type SensorWidthID=DataOptionWithId<Sensor>
class ZbService{
    //{"ZbState":{"Status":56,"IEEEAddr":"0x2C1165FFFE882D9B","ShortAddr":"0x0000","DeviceType":1}}
    address(obj:any):SensorWidthID|undefined|void{
        console.log("\n+++ zbbridge.service.ts-16 +++ debug obj:",obj);
        if(!obj||typeof obj!=='object') return console.log("\n+++ zbbride.index.ts-5 ++ ERROR-01: data format wrong")
        const zbState=obj.ZbState;
        if(!zbState || typeof zbState!=='object') return console.log("\n+++ ZbState.service.ts-13 +++ ERROR-002: zbstate is error");
        const status=zbState.Status;
        if(!_STATUS_GET_ADDRESS_LIST.includes(status)) return console.log("\n+++ wrong status:",status)
        const id=zbState.IEEEAddr;
        const shortAddr=zbState.ShortAddr
        if(!id || !shortAddr) return console.log("\n+++ zbbride.service.ts-18 +++ ERROR-003: data error",{id,shortAddr})
        console.log("\n+++ zbbridge.service.ts-25 +++ result:",{id,shortAddr})
        return {id,shortAddr,type:_DATA_TYPE}
    }

    //obj={"ZbParent":{"Device":"0x0000","Children":1,"ChildInfo":["0x00124B002396E6B4"]}}
    connectStatus(obj: any) {
        try {
            if (!obj || typeof obj !== 'object') throw new Error("ERR-001:payload is wrong format")
            const ZbParent = obj.ZbParent;
            if (!zbservice) throw new Error("ERR-002: ZbParent is wrong");
            const ChildInfo = ZbParent.ChildInfo as string[];
            if (!ChildInfo || !Array.isArray(ChildInfo)) throw new Error("ERR-003: ChildInfo is wrong");
            const outs = ChildInfo.map(id => Object.assign({}, { id, online: true,type:_DATA_TYPE }))
            console.log("\n+++ zbbridge.service.ts-38 +++ outs:", outs);
            return outs;
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "other"
            console.log("\n+++ zbbridge.service.ts-39 +++ [connectStatus] %s", msg);
        }

    }
}

const zbservice=new ZbService()

const topics:TopicData[]=[
    {
        id:'address',
        ref:'tele/:eid/SENSOR',//
        handle(packet,client,network,service){
            const payload=packet.payload.toString();
            const obj=JSON.parse(payload);
            const infor=zbservice.address(obj);
            if(!infor) return log("\n[%s] ERROR-001: cannot get infor",this.id)
            service.update([infor]).then(list=>log("[%s] lisst ",this.id,list))
        }
    },
    {
        id:'address2',
        ref:'tele/:eid/RESULT',
        handle(packet,client,network,service){
            const payload=packet.payload.toString();
            const obj=JSON.parse(payload);
            const infor=zbservice.address(obj);
            if(!infor) return log("\n[%s] ERROR-001: cannot get infor",this.id)
            service.update([infor]).then(list=>log("[%s] lisst ",this.id,list));
            
        }
    },
    {
        // tele/E8DB849DBFAE/RESULT={"ZbParent":{"Device":"0x0000","Children":1,"ChildInfo":["0x00124B002396E6B4"]}}
        id:'online',
        ref:'tele/:eid/RESULT',
        handle(packet,client,network,service){
            const payload=packet.payload.toString();
            const obj=JSON.parse(payload);
            const idvs=zbservice.connectStatus(obj);
            if(!idvs) return log("[%s] cannot get parrent infor",this.id);
            service.update(idvs);//@@@
        }
    },
    //tele/E8DB849DBFAE/SENSOR
    //{"ZbReceived":{"0xAA75":{"Device":"0xAA75","0500?00":"010000010000","ZoneStatusChange":1,"ZoneStatusChangeZone":1,"Contact":1,"Endpoint":1,"LinkQuality":165}}}
    {
        id:'sensor',
        ref:'tele/:eid/SENSOR',
        handle(packet,client,network,service){

        }
    }
]

const remote:DeviceRemote=(idvs,network)=>{
    console.log("\n++++ zbbridge.service.ts-56 +++ [remote] NOT BE HANDLE");
    return idvs.map(i=>i.id);
}

const getInf:DeviceGetInfor=(idvs,network)=>{
    console.log("\n+++ zbbridge.service.ts-61 [getInf] NOT BE HANDLE");
    const eids:string[]=getList(idvs,"eid");
    eids.forEach(eid=>{
        const topic=`cmnd/${eid}/ZbInfo`
        const packet=createPacket({topic,payload:'?'})
        network.publish(packet)
    })
    return idvs.length
}

const service:TopicService={
    id:_DATA_TYPE,
    type:'client',
    remote,
    getInf,
    topics
}

export default service;