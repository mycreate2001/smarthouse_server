/** import */
import { ModulePackage } from "../../interface";
import SocketService from "./socket_handle";


export default function startup(infor:ModulePackage,modules:ModulePackage[]){
    const socketModule=modules.find(m=>m.id==infor.parentId);
    if(!socketModule) return 1;
    const socket=socketModule.module
    const service=new SocketService(socket);
    return service
}
