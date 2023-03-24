import { WebSocketServer } from 'ws'
import { createLog } from "../../lib/log";
import { ModulePackage } from "../../lib/module-loader/module.interface";

const _PORT=8888
export default function startup(infor:ModulePackage){
    const port=(infor.params.port)?infor.params.port:_PORT
    const websocket=new WebSocketServer({port},()=>{
        createLog(infor.id,"center")("start at '%d'",port);
    })
    return websocket;
}