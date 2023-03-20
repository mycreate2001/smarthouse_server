import { createLog } from '../../lib/log';
import { InputModule, ModuleInfor, ModulePackage } from '../../lib/module-loader/module.interface';
import Network from './network'

export default function startupNetwork(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center")
    try{
        const networkModules=modules.network;
        if(!networkModules||!networkModules.length||!networkModules.filter(m=>m.module).length)
            throw new Error("Load network was failred!");

        //handle clients
        const clients=networkModules.map(m=>m.module);
        const network=new Network(...clients);
        log("load success!");
        return network;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other message"
        log("### ERROR:%s\n",msg,modules)
        return null;
    }
}