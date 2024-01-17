import { createLog } from 'advance-log';
import { ModulePackage } from 'module-loader/interface';
import MqttLog from './mqtt.log';
import MqttService from './mqtt.service';
const _PORT=1884;
const _LOG=true
export default function startup(infor:ModulePackage){
    //1. input & verify
    const port:number=process.env.MQTT_PORT||infor.params.port||_PORT
    //2. execute
    const log=createLog(infor.id);
    const mqtt= new MqttService(port,()=>{
        log("start at %d",port)
    });
    // if(_LOG) MqttLog(mqtt)
    return mqtt
}