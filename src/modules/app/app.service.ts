import { createLog } from "advance-log";
import { Device, TopicData, TopicService } from "../device/device.interface";
import { createPacket } from "../network/network.service";
import { NetworkClient } from "../network/network.interface";
import { PublishPacket } from "packet";
import { toArray } from "../../lib/utility";
const log=createLog("app","center");
const _RESPOND_TOPIC="api/respond"
const topics:TopicData[]=[
    {
        id:'request',
        ref:'api/request',
        handle(packet,client,network,service){
            const _payload=packet.payload.toString().toLowerCase();
            console.log("\n+++ app.service.ts-12 +++ payload:",_payload);
            switch(_payload){
                case 'devices':{
                    service.db.search()
                    .then(devices=>{
                        const payload={success:1,type:"full",data:devices}
                        const packet=createPacket({payload,topic:_RESPOND_TOPIC})
                        client.publish(packet,displayPublish(client,packet,"devices"))
                    })
                }
                break;

                case 'ndevices':{
                    const payload={success:1,type:"full",data:Object.keys(service.ndevices).map(key=>service.ndevices[key])}
                    const topic='api/respond'
                    const packet=createPacket({payload,topic})
                    client.publish(packet,displayPublish(client,packet,"ndevices"))
                }
                break;

                default:
                    const data=_payload.length>20?_payload.substring(0,20)+"...":_payload
                    const payload={success:0,msg:`cannot find '${data}'`}
                    const packet=createPacket({payload,topic:_RESPOND_TOPIC})
                    client.publish(packet,displayPublish(client,packet,"default"))
            }
        }
    },
    {
        id:'remote from app',
        ref:'api/remote',
        handle(packet,client,network,service){
            let idvs=toArray(JSON.parse(packet.payload.toString()) as Device);
            // idvs=[].concat(idvs);
            const ids=idvs.map(i=>i.id).filter(x=>!!x);
            if(ids.length==0) return publish("cannot get device infor",client)
            service.db.gets(ids).then(devices=>{
                const _idvs:Device[]=[]
                devices.forEach(device=>{
                    const idv=idvs.find(dv=>dv.id==device.id)
                    if(!idv) return;
                    _idvs.push(Object.assign({},device,idv))
                })
                service.remote(_idvs,network);
                const success=idvs.length
                publish(idvs.map(i=>i.id),client,success)
            })
            
        }
    }
]


function publish(msg:string|object,client:NetworkClient,success:number=0){
    const _msg=typeof msg!=='string'?JSON.stringify(msg):msg
    let packet:PublishPacket
    if(success) {
        packet=createPacket({payload:{success:1,data:_msg},topic:_RESPOND_TOPIC})
    }else{
        packet=createPacket({payload:{success:0,msg:_msg},topic:_RESPOND_TOPIC})
    }
    client.publish(packet,displayPublish(client,packet))
}
/** handle message for client publish */
function displayPublish(client:NetworkClient,packet:PublishPacket,debug?:string){
    return function errHandle(err:Error|undefined){
        const result=err?"failred":"success"
        debug=debug||""
        log("%d[private publish] to %s=>%d\n\tmsg:%s",debug,client.id,result,packet.payload.toString())
    }
}
const appService:TopicService={
    type:'server',
    id:'app',
    topics,
}

export default appService;