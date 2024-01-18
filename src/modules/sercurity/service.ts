// import MqttDriverService from "../handle_mqtt/service";
import { CommonDriverService } from "../../interface/device.interface";
import { CommonNetwork } from "../../interface/network.interface";
import UserService from "../user/user.service";
import { createDebug, createLog } from "advance-log";
import { wildcard } from "ultility-tools";

const _LABEL="Serc"
const log=createLog(_LABEL,{enablePos:true});
const debug=createDebug(_LABEL,1)
const _ALLOW_NEW_LINK:DecideNewLink='reject'
const _DEBUG:boolean=false;

export default class SercurityService{
    server:CommonNetwork;
    driver:CommonDriverService;
    userService:UserService;
    log:any;
    constructor(server:CommonNetwork,driver:CommonDriverService,userService:UserService,opts?:Partial<SercurityServiceOpts>){
        this.server=server;
        this.driver=driver;
        this.userService=userService;
        const newLink=opts?.newLink||_ALLOW_NEW_LINK;
        const label=opts?.label||_LABEL;
        const _debug=opts?.debug||_DEBUG
        this.log=createLog(_LABEL+"-"+label.substring(0,15),{enablePos:_debug})
        /** login */
        server.authenticate=async(client,uid,pass,callback)=>{
            try{
                const user=await userService.login(uid,pass);
                client.user=user;
                log("%d login => success",client.id,{uid,pass})
                callback(null,true)
            }
            catch(err){
                const msg=err instanceof Error?err.message:"other"
                log("%d login => Failed %s ",client.id,msg,{uid,pass})
            }
        }

        /** publish  */
        server.authorizePublish=(client,packet,callback)=>{
            const topic=packet.topic;
            const user=client.user;
            try{
                // no topic =>block
                if(!topic) throw new Error("no topic");
                // noet yet login => block
                if(!user) throw new Error("not yet login");

                const sercurities=driver.getServices().filter(s=>s && wildcard(topic,s.ref));
                // new link
                if(!sercurities.length){
                    if(newLink=='reject') throw new Error("newLink => reject");
                    log("%d publish %s =>success, note:%s",client.id,topic,"new link");
                    return callback(null);
                }

                const success=sercurities.every(ser=>{
                    //group NOT include sercurity function => block
                    if(!user.pubs.includes(ser.id)){
                        debug(1,"denied",{user});
                        return false;
                    }
                    return true;
                })

                // denied => block
                if(!success) throw new Error("accept denied");
                log("%d publish %s =>success",client.id,topic);
                callback(null)

            }
            catch(err){
                const msg=err instanceof Error?err.message:"other";
                log("%d publish % =>failed %s",client.id,topic,msg);
                return callback(err);
            }
        }
    }

}

///////////////////////////
type DecideNewLink="accept"|"reject"
export interface SercurityServiceOpts{
    newLink:DecideNewLink;
    label:string;
    debug:boolean;  //true= debug(position)
}
