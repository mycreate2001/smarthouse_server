/**
 * event:connect        on('client',(client)=>{})
 * event:disconnect     on('clientDisconnect',(client)=>{})
 * publish              publish
 * subscribe            subscribe(topic, deliverfunc, callback)
 *                          - topic <string>
 *                          - deliverfunc <Function>: (packet,cb)=>void
 *                          - callback:<Function>
 */
// const Aedes=require('aedes');
const Net=require('net');
// import aedesServer from "aedes:server";
import * as aedes from 'aedes'
import { createLog } from '../../lib/log';
// import Aedes from 'aedes:server';

/** default */
const _PORT_DEFAULT=1883;


/**
 * 
 * @param {mqttOptions} options 
 * @returns {Aedes.Aedes} Mqtt server
 */
export default function startup(options?:mqttOption){
    const log=createLog("Mqtt",'center');
    const _df={port:_PORT_DEFAULT}
    const _opts=Object.assign(_df,options);
    const xaedes=new aedes.default()
    const server=Net.createServer(xaedes.handle);
    server.listen(_opts.port,()=>{
        log("start at port=%d",_opts.port);
    })
    return xaedes;
}


export interface mqttOption{
    port:number;
}


