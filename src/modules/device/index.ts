import { toArray } from "../../lib/utility";
import { Sercurity, SercurityCommon } from "../sercurity/interface";
import { TopicService } from "./device.interface";

import DeviceService from "./device.service";

export default function startDeviceService(infor:any,network:any,db:any,services:any[],userService:any,sercurity:SercurityCommon){
   //1. input & verify
    if(!db)throw new Error("load database error");
    if(!network) throw new Error("load network error")
    if(!services) throw new Error("topic services error");
    //2. execute
    let _services:any[]=[]
    services.forEach(service=>{
        _services=_services.concat(service)
    })

    // service
    const service=new DeviceService(network,db,_services,userService);
    
    // sercurity
    const sercurities=convertTopicService2Sercurity(service.topicServices);
    sercurity.setSercurity(sercurities);

    // result
    return service; /** success */
}


/** mini functions */
function convertTopicService2Sercurity(topicServices:TopicService|TopicService[]):Sercurity[]{
    const _topicServices:TopicService[]=toArray(topicServices);
    const sercurities:Sercurity[]= _topicServices.reduce((all:Sercurity[],cur)=>{
        const sercus:Sercurity[]=cur.topics.map(topic=>{
            const sers:Sercurity={
                id:topic.id,
                name:topic.name||topic.id,
                ref:topic.ref,
                subcribe:topic.subcribe||[],
                publish:topic.publish||[]
            }
            return sers;
        })
        return [...all,...sercus]
    },[])
    return sercurities
}