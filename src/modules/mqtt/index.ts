import { ModuleInfor, ModulePackage } from '../../interface';
import Mqtt from './mqtt';
const _PORT=1884
export default function startup(infor:ModuleInfor,apps:ModulePackage[]){
    //handle params
    const port=(infor&& infor.params&&infor.params.port)?infor.params.port:_PORT
    const mqtt=Mqtt({port})
    return mqtt;
}