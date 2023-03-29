import { ModulePackage } from '../../lib/module-loader/module.interface';
import Mqtt from './mqtt.service'
const _PORT=1884
export default function startup(infor:ModulePackage){
    //1. input & verify
    const port=infor.params.port?infor.params.port:_PORT
    //2. execute
    const mqtt=new Mqtt({port})
    return mqtt;
}