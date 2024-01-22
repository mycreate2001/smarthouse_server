import { createLog } from 'advance-log';
import { ModulePackage } from 'module-loader/interface';
import MqttService from './mqtt.service';
import { CommonNetworkPacket } from '../../interface/network.interface';
const _PORT=1884;
const _NETWORK_ID="mqtt"

export default function startup(infor:ModulePackage):CommonNetworkPacket{
    //1. input & verify
    const port:number=infor.params.port||_PORT
    const id:string=infor.params.networkId||_NETWORK_ID
    //2. execute
    const log=createLog(infor.id);
    const mqtt= new MqttService(port,()=>{
        log("start at %d",port)
    });
    // if(_LOG) MqttLog(mqtt)
    return {service:mqtt,id}
}