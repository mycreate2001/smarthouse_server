import { WebSocketServer } from 'ws'
import { createLog } from "../../lib/log";
import { ModuleInfor, ModulePackage } from "../../lib/module-loader/module.interface";

const _PORT=8888
export default function startup(infor:ModuleInfor,apps:ModuleInfor[]){
    const log=createLog(infor.id,"center")
    const port=(infor.params.port)?infor.params.port:_PORT
    const websocket=new WebSocketServer({port},()=>{
        log("start at '%d'",port);
    })
    log("load success!")
    return websocket;
}