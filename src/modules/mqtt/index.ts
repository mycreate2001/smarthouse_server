import { createLog } from '../../lib/log';
import { ModuleInfor, ModulePackage } from '../../lib/module-loader/module.interface';
import Mqtt from './mqtt';
const _PORT=1884
export default function startup(infor:ModuleInfor,apps:ModulePackage[]){
    const log=createLog(infor.id,"center")
    //handle params
    const port=infor.params.port?infor.params.port:_PORT
    const mqtt=Mqtt({port})
    log("load success!");
    return mqtt;
}