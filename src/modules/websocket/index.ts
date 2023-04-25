import { WebSocketServer } from 'ws'
import { createLog } from "advance-log";
import { ModulePackage } from "../../lib/module-loader/module.interface";

const _PORT=8888
export default function startup(infor:ModulePackage){
    const port=process.env.WEBSOCKET_PORT||infor.params.port||_PORT
    const websocket=new WebSocketServer({port},()=>{
        createLog(infor.id,"center")("start at '%d'",port);
    })
    return websocket;
}