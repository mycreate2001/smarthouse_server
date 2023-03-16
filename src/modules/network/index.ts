import { createLog } from '../../lib/log';
import { InputModule, ModuleInfor, ModulePackage } from '../../lib/module-loader/module.interface';
import Network from './network'

export default function startupNetwork(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center")
    const networkModules=modules.network;
    if(!networkModules||!networkModules.length||!networkModules.filter(m=>m.module).length){
        log("### ERROR[1] ###: Load network was failred!");
        return null;
    }
    //handle clients
    const clients=networkModules.map(m=>m.module);
    const network=new Network(...clients);
    log("load success!");
    return network;
}