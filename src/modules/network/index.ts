import { ModuleInfor, ModulePackage } from '../../interface';
import Network from './network'

export default function startup(params:any,apps:ModulePackage[]){
    //handle clients
    const clients:any[]=[];
    apps.forEach(app=>{
        if(app.type!=='input') return;
        clients.push(app.module)
    });
    const network=new Network(...clients);
    return network;
}