import { InputModule, ModuleInfor, ModulePackage } from '../../lib/module-loader/module.interface';
import Network from './network'

export default function startup(infor:ModulePackage,modules:InputModule){
    //handle clients
    const clients=modules.network.map(m=>m.module);
    const network=new Network(...clients);
    return network;
}