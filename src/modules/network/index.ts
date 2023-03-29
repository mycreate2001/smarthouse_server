import { ModulePackage } from '../../lib/module-loader/module.interface';
import Network from './network.service'

export default function startupNetwork(infor:ModulePackage,networks:any[]){
    /** verify */
    if(!networks||!networks.length)
    throw new Error("Load network was failred!");

    /** execute */
    const network=new Network(...networks);
    return network;
}