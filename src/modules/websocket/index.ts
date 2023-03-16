import { WebSocketServer } from 'ws'
import { createLog } from "../../lib/log";
import { ModuleInfor, ModulePackage } from "../../lib/module-loader/module.interface";

const _PORT=8888
const log=createLog("websocket","center")
export default function startup(infor:ModuleInfor,apps:ModuleInfor[]){
    const port=(infor&& infor.params && infor.params.port)?infor.params.port:_PORT
    const websocket=new WebSocketServer({port},()=>{
        log("start at '%d'",port);
    })
    return websocket;
}