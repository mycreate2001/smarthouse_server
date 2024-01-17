import { createLog } from "advance-log"

const _LABEL_DEFAULT="Mqtt>Log"
export default function MqttLog(mqtt:any,label:string=_LABEL_DEFAULT){
    const log=createLog(label);
    mqtt.on("publish",(packet:any,client:any)=>{
        const _client=client||{id:'server'};
        const topic=packet.topic;
        // const content:string=packet.payload.toString().substring(0,100);
        log("%d publish %s\nmsg:",_client.id,topic,{...packet,payload:packet.payload.toString()},"\n\n")
    })
}