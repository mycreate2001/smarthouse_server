import { createLog } from 'advance-log';
import { ModulePackage } from 'module-loader/interface';
import mqttService from './mqtt.service';
import MqttLog from './mqtt.log';
const _PORT=1884;
const _LOG=true
export default function startup(infor:ModulePackage){
    //1. input & verify
    const port:number=process.env.MQTT_PORT||infor.params.port||_PORT
    //2. execute
    const log=createLog(infor.id,"center");
    const mqtt= mqttService(port,()=>{
        log("start at %d",port)
    });
    log("Mqtt Log=",_LOG?"Enable":"Disable")
    if(_LOG) MqttLog(mqtt)
    return mqtt
}