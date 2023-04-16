import { PublishPacket } from "packet";
import { DeviceGetInfor, DeviceRemote, DeviceStatus, TopicData, TopicService } from "../device/device.interface";
import { getList } from "../../lib/utility";
import { createPacket } from "../network/network.service";
import { DeviceTasmotaBasic } from "./tasmota_basic.interface";
import { getDevice} from "./tasmota_basic_ultility";
import { createLog } from "advance-log";

const log=createLog("tasmota_basic","center")
const _DATA_TYPE="tasmota_basic"

const tasmotaBasic: TopicData[] = [
    {
        id: 'online',
        ref: 'tele/:id/LWT',
        handle: (packet, client, network, service) => {
            const str = packet.payload.toString();
            const online = str.toLowerCase() === 'online';
            const _client = client || { id: "undknow" }
            service.onConnect(online, _client)
        }
    },
    {
        //tasmota/discovery/E8DB8494B051/config
        //{"ip":"192.168.137.72","dn":"Tasmota","fn":["Tasmota","Tasmota2","Tasmota3",null,null,null,null,null],
        // "hn":"E8DB8494B051-4177","mac":"E8DB8494B051","md":"Sonoff T1 3CH","ty":0,"if":0,
        // "ofln":"Offline","onln":"Online","state":["OFF","ON","TOGGLE","HOLD"],
        // "sw":"12.4.0","t":"E8DB8494B051","ft":"%prefix%/%topic%/",
        // "tp":["cmnd","stat","tele"],"rl":[1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
        // "swc":[-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1],
        // "swn":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"btn":[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],"so":{"4":0,"11":0,"13":0,"17":0,"20":0,"30":0,"68":0,"73":0,"82":0,"114":0,"117":0},"lk":0,"lt_st":0,"sho":[0,0,0,0],"sht":[[0,0,0],[0,0,0],[0,0,0],[0,0,0]],"ver":1}
        id: 'configure',
        ref: 'tasmota/discovery/:id/config',
        handle(packet, client, network, service){
            const devices:DeviceTasmotaBasic[] = getDevice(packet.payload.toString(),_DATA_TYPE);
            log("#config ",devices);
            service.onConfigure(devices, client);
            // devices.forEach(dv => service.getInfor(dv.id, client));
        }
    },
    {
        id: 'result',
        ref: 'stat/:id/RESULT',//stat/E8DB8494B051/RESULT //tele/:id/STATE
        handle: (packet, client, network,service) => {
            const payload = JSON.parse(packet.payload.toString());

            //{"POWER2":"OFF"}
            const stts: DeviceStatus[] = [];
            const eid: string = client.id || ""
            Object.keys(payload).forEach(key => {
                if (!key.startsWith("POWER")) return
                const a = key.substring(key.length - 1);
                const id = parseInt(a) || 1
                const status = payload[key] == "ON" ? 1 : 0
                stts.push({ id: eid + "@" + id, status })
            })
            if (stts.length) service.onUpdate(stts);
        }
    },
    {
        id: 'state',
        ref: 'tele/:id/STATE',//tele/E8DB8494B051/STATE tele/E8DB849DBFAE/SENSOR
        handle: (packet, client: any, network,service) => {
            const payload = JSON.parse(packet.payload.toString())
            const stts: DeviceStatus[] = [];
            const eid: string = client.id || ""
            Object.keys(payload).forEach(key => {
                if (!key.startsWith("POWER")) return
                const a = key.substring(key.length - 1);
                const id = parseInt(a) || 1
                const status = payload[key] == "ON" ? 1 : 0
                stts.push({ id: eid + "@" + id, status })
            })
            console.log("\n++++ tasmota.handle.ts-109 ++++", { stts })
            // if(stts.length) service.update('update',stts);
        }
    },
    {
        //tele/E8DB849DBFAE/RESULT
        // payload:{"ZbState":{"Status":34,"IEEEAddr":"0x00124B0023B46876","ShortAddr":"0x329F","ParentNetwork":"0x0000","JoinStatus":1,"Decision":0}}
        id: 'join network',
        ref: 'tele/:eid/RESULT',
        handle(packet, client, network,service){
            const obj = JSON.parse(packet.payload.toString());
            const ZbState = obj.ZbState;
            if (!ZbState) return;//not correct format
            const status = ZbState.Status;
            if (!status || status !== 34) return;
            const fullAddr = ZbState.IEEEAddr;
            const shortAddr = ZbState.ShortAddr;
            console.log("\n+++ config data +++ ", { fullAddr, shortAddr });
            service.onEdit([{ id: fullAddr, ipAddr: shortAddr, mac: fullAddr }], client)
        }
    },
    {
        //tele/E8DB849DBFAE/SENSOR tele/E8DB849DBFAE/SENSOR
        //{"ZbReceived":{"0x329F":{"Device":"0x329F","Humidity":69.45,"Endpoint":1,"LinkQuality":92}}}
        //payload:{"ZbReceived":{"0x329F":{"Device":"0x329F","Temperature":27.89,"Endpoint":1,"LinkQuality":94}}}
        id: "value of sensor",
        ref: 'tele/:eid/SENSOR',
        handle(packet, client, network,service){
            const obj = JSON.parse(packet.payload.toString());
            const ZbReceived = obj.ZbReceived;
            if (!ZbReceived) return;
            const idvs = Object.keys(ZbReceived).map(key => {
                const dv = ZbReceived[key];
                const networkId = dv.Device as string;
                return { ...dv, networkId }
            })
            if (!idvs.length) return;
            console.log("\n+++ device.route.ts-96 ", idvs);
            service.updateBySearch("ipAddr", idvs, client)
        }
    }
]


/**
 * This function publishes a MQTT packet to turn on/off a device controlled by Tasmota firmware.
 * @param idvs - An array of objects representing the device's state and configuration. Each object has
 * properties such as "id", "type", "status", and "fns".
 * @param network - The network parameter is an object that represents the network connection used to
 * communicate with the device. It likely contains methods for publishing and subscribing to MQTT
 * topics.
 */
export const remote:DeviceRemote=(idvs,network)=>{
    console.log(`\n+++ remote[${_DATA_TYPE}] +++ \n\tidvs:`,idvs)
    idvs.forEach((cdv:any)=>{
        if(cdv.type!==_DATA_TYPE) return;//Not data type
        const _arrs=cdv.id.split("@");
        const eid=_arrs[0];
        let pos=_arrs[1]
        if(!pos) pos=""
        // const packet:PublishPacket={
        //     cmd:'publish',
        //     payload:cdv.fns[cdv.status],
        //     dup:false,
        //     qos:0,
        //     retain:false,
        //     topic:`cmnd/${eid}/Power${pos}`
        // }
        const status=cdv.fns[cdv.status];
        const packet=createPacket({payload:status,topic:`cmnd/${eid}/Power${pos}`})
        network.publish(packet)
    })
}

/**
 * The function takes in device information and a network object, and returns the number of successful
 * publish operations to the network.
 * @param idvs - An array of objects representing devices, where each object has properties such as
 * "type" and "eid".
 * @param network - The `network` parameter is likely an object or module that provides functionality
 * for publishing messages to a network or messaging system. It is used in the `getInf` function to
 * publish a message to a topic constructed from the `eid` value of each device in the `idvs` array.
 * @returns The function `getInf` returns the length of the `results` array, which is the number of
 * unique `type` values in the `idvs` array.
 */
export const getInf:DeviceGetInfor=(idvs,network)=>{
    const results=getList(idvs,"type").map(type=>{
        const cidvs:any[]=idvs.filter(i=>i.type==type);
        const result=getList(cidvs,"eid").map(eid=>{
            const payload=cidvs.filter(c=>c.eid==eid);
            const packet=createPacket({topic:`cmnd/${eid}/State`,payload:"?"})
            network.publish(packet);
            console.log("\n+++ [getInfo] publish tasmota_basic.index.ts-163 +++\n")
            return true;
        }).filter(x=>!!x)
        return result.length;
    })
    return results.length
}

const service:TopicService={
    id:_DATA_TYPE,
    type:'client',
    topics:tasmotaBasic,
    remote,
    getInf
}

export default service;