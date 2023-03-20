import { createLog } from "../../lib/log";
import { Device, DeviceStatus, Equipment } from "../device/device.interface";
const log=createLog("Network","center");
export default class Network{
    networks:any[]=[];
    constructor(...networks:any[]){
        // this.networks=this.networks.concat(networks);
        this.networks=networks;
        this.networks.forEach(network=>{
            network.onConnect=this.onConnect;
            network.onUpdate=this.onUpdate;
            network.onConfigure=this.onConfigure;
        })
    }
    
    onConnect:NetworkConnect=(online,client,server)=>{console.log("\n[network.ts-17] online:",online)}
    onUpdate:NetworkUpdate=(sttInfor,client,server)=>{
        log(" onUpdate/Status:",sttInfor)
    };
    onConfigure:NetworkConfig=(equipment,devices,client,server)=>{
        log("onConfig/devices:",devices)
        const id=devices[0].id;
        setTimeout(()=>{
            this.getInfor(id);
        },2000)
        let status=devices[0].status
        setInterval(()=>{
            status=1-status;
            this.remote({id,status})
        },5000)
    };
    remote(stt:DeviceStatus){
        return this.networks.map(network=>network.remote(stt))
    }

    getInfor(deviceId:string){
        return this.networks.map(network=>network.getInfor(deviceId))
    }
}

export type NetworkConnect=(online:boolean,client:any,server:any)=>void;
export type NetworkUpdate=(status:DeviceStatus[],client:any,server:any)=>void;
export type NetworkConfig=(equipment:Equipment,devices:Device[],client:any,server:any)=>void;

