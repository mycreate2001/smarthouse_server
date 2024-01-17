import MqttDriverService from "./service";

export default function startup(inf:any,server:any){
    const service=new MqttDriverService(server);
    return service;
}