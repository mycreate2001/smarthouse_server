import { ModulePackage } from 'module-loader/interface';
import Mqtt from './mqtt.service'
const _PORT=1884
export default function startup(infor:ModulePackage){
    //1. input & verify
    const port:number=process.env.MQTT_PORT||infor.params.port||_PORT
    //2. execute
    const mqtt=new Mqtt({port})
    return mqtt;
}