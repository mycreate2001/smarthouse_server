import SercurityService from "./service";

export default function startup(inf:any,userService:any,networks:any[],drivers:any[]){
    const service=SercurityService(userService,networks,drivers,{allowPublishOtherTopic:true,allowSubscribeOtherTopic:false})
    return service;
}