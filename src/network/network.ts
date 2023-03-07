import { createLog } from "../lib/log";
import { AuthenticateHandle, AuthorizePublishHandle, AuthorizeSubscribeHandle, PublishPacket, ServerSubscribeHandle } from "./interface.type";

const log=createLog("Network","center");
export default class Network{
    clients:any[]=[];
    constructor(...clients:any[]){
        // this.clients=this.clients.concat(clients);
        this.clients=clients;
        this.on("client",(client:any)=>{
            log("%d connect",client.id);
        })
    }
    on(title: string, callback: Function) {
        return this.clients.map(client=>client.on(title,callback))
    }

    /** publish from server  */
    publish(packet:PublishPacket){
        return this.clients.map(client=>client.publish(packet))
    }

    setAuthenticate(handle:AuthenticateHandle){
        return this.clients.map(client=>client.authenticate=handle)
    }

    setAuthSubscribe(handle:AuthorizeSubscribeHandle){
        return this.clients.map(client=>client.authorizeSubscribe=handle)
    }

    setAuthPublish(handle:AuthorizePublishHandle){
        return this.clients.map(client=>client.authorizePublish=handle)
    }

    subscribe(topic:string,callback:ServerSubscribeHandle){
        return this.clients.map(client=>client.subscribe(topic,callback))
    }

}
