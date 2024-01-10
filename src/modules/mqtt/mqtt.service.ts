import * as Aedes from "aedes";
// import * as Net from "net";
const Net=require('net');


export default function mqttService(port:number,callback?:()=>void){
    const mqtt=new Aedes.default()
    const server=Net.createServer(mqtt.handle);
    server.listen(port,()=>{
        if(!callback||typeof callback!=='function') return;
        callback();
    })
    return mqtt;
}
