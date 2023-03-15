import { ModuleInfor, ModulePackage } from '../../lib/module/module.interface';
import Network from './network'

export default function startup(params:any,modules:ModulePackage[]){
    //handle clients
    const clients:any[]=[];
    modules.forEach(m=>{
        if(m.type!=='network') return;
        clients.push(m.module)
    })
    const network=new Network(...clients);
    return network;
}