import { createLog } from '../../lib/log';
import { InputModule, ModulePackage } from '../../lib/module-loader/module.interface';
import Network from './network'

export default function startupNetwork(infor:ModulePackage,networks:any[]){
    const log=createLog(infor.id,"center")
    try{
        /** verify */
        if(!networks||!networks.length)
            throw new Error("Load network was failred!");

        /** execute */
        const network=new Network(...networks);
        log("load success!");
        return network;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other message"
        log("### ERROR:%s\n",msg)
        return null;
    }
}