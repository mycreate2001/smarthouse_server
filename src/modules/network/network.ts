import { PublishPacket } from "packet";
import { createLog } from "../../lib/log";
import { Device, DeviceStatus, Equipment } from "../device/device.interface";
const log=createLog("Network","center");
export default class Network{
    networks:any[]=[];
    constructor(...networks:any[]){
        // this.networks=this.networks.concat(networks);
        this.networks=networks;
        this.update();
        // console.log("\n++++ network.ts-11\nnetworks:",networks)
    }
    onConnect:NetworkConnect=(online,client,server)=>{console.log("\n[network.ts-17] online:",online)}
    onUpdate:NetworkUpdate=(sttInfor,client,server)=>{
        log(" onUpdate/Status:",sttInfor)
    };
    update(){
        this.networks.forEach(network=>{
            network.onConnect=this.onConnect;
            network.onUpdate=this.onUpdate;
            network.onConfigure=this.onConfigure;
            network.onUpdateDevice=(devices:Device[],client:any,server:any)=>{
                this.onUpdateDevice(devices,client,this)
            }
            network.publish=(packet:PublishPacket)=>{this.publish(packet)}
            // network.publish=this.publish;
        })
    }
    onConfigure:NetworkConfig=(equipment,devices,client,server)=>{
        log("onConfig/devices:",devices.map(dv=>dv.id),"\nequipment:",equipment)
    };
    remote(stt:DeviceStatus){
        return this.networks.map(network=>network.remote(stt))
    }

    getInfor(deviceId:string){
        return this.networks.map(network=>network.getInfor(deviceId))
    }
    publish(packet:PublishPacket){
        log("publish %s :%s",packet.topic,packet.payload)
        this.networks.map(network=>network._publish(packet))
    }

    onUpdateDevice(devices:Device[],client:any,server:any){
        log("onUpdateDevice ### Warning! not be handle")
    }
}

export const publishPacketDefault:PublishPacket={
    cmd:'publish',
    qos:0,
    retain:false,
    payload:'',
    topic:'unknown',
    dup:false
}
export function createPublishPacket(packet:Partial<PublishPacket>&{topic:string,payload:string}):PublishPacket{
    return Object.assign({},publishPacketDefault,packet)
}

export type NetworkConnect=(online:boolean,client:any,server:any)=>void;
export type NetworkUpdate=(status:DeviceStatus[],client:any,server:any)=>void;
export type NetworkConfig=(equipment:Equipment,devices:Device[],client:any,server:any)=>void;
export type NetworkUpdateDevice=(devices:Device[],client:any,server:any)=>void;

