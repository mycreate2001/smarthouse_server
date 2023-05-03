import { createLog } from "advance-log";
import { Device, TopicData, TopicService } from "../device/device.interface";
import { clientPublish } from "../network/network.service";
import { createObject, toArray } from "../../lib/utility";
import { UpdateDevice } from "./app.interface";
const log=createLog("app","center");

const _TOPIC_RESPOND_DIRECT="api/respond"
const _CODE_OK={code:0,msg:"success"};
const _CODE_001={code:1,msg:"out of case"}
const _CODE_002={code:2,msg:"cannot get device infor"}
const _CODE_003={code:3,msg:'edit data is wrong format'}
const _CODE_004={code:4,msg:'Nothing change'}
const _CODE_005={code:5,msg:'handle edit error'}
const _CODE_006={code:6,msg:'login by token error'}
const _CODE_007={code:7,msg:'login failred'}
const topics:TopicData[]=[
    /** request infor */
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
                        const payload={type:"full",data:devices}
                        // clientPublish(_TOPIC_RESPOND_DIRECT,payload,client,_CODE_OK.code)
                        clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_OK,payload)
                    })
                }
                break;

                case 'ndevices':{
                    const payload={type:"full",data:service.ndeviceDb.all()}
                    // clientPublish(_TOPIC_RESPOND_DIRECT,payload,client,_CODE_OK.code)
                    clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_OK,payload)
                }
                break;

                default:
                    // clientPublish(_TOPIC_RESPOND_DIRECT,_CODE_001.msg,client,_CODE_001.code)
                    clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_001)
            }
        }
    },

    /** remote control*/
    {
        id:'remote from app',
        ref:'api/remote',
        handle(packet,client,network,service){
            let idvs=toArray(JSON.parse(packet.payload.toString()) as Device);
            // idvs=[].concat(idvs);
            const ids=idvs.map(i=>i.id).filter(x=>!!x);
            if(ids.length==0) return clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_002);//(_TOPIC_RESPOND_DIRECT,_CODE_002.msg,client,_CODE_002.code)
            service.db.gets(ids).then(devices=>{
                const _idvs:Device[]=[]
                devices.forEach(device=>{
                    const idv=idvs.find(dv=>dv.id==device.id)
                    if(!idv) return;
                    _idvs.push(Object.assign({},device,idv))
                })
                service.remote(_idvs,network);
                // clientPublish(_TOPIC_RESPOND_DIRECT,_idvs,client,_CODE_OK.code)
                clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_OK,_idvs)
            })
            
        }
    },

    /** edit devices (add,remove,edit) */
    {
        id:'add_device',
        ref:'api/edit',
        handle(packet,client,network,service){
            console.log("\n+++ app.service.ts-76 [edit] start ")
            async function execute(){
                console.log("\n+++ app.service.ts-78 [edit] execute")
                //1. input & verify
                const payload=JSON.parse(packet.payload.toString()) as UpdateDevice;
                console.log("\n+++ app.service.ts-81 [edit] ",{payload})
                if(!payload||!Object.keys(payload).length) throw new Error("data error");
                const {devices,removes}=payload
                const uList=(devices && devices.length)?await service.edit(devices):[];
                const dList=(removes && removes.length)?await service.delDevice(removes):[];
                return {uList,dList}
            }

            execute()
            .then(({uList,dList})=>{
                clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_OK,{updateDevices:uList.map(u=>u.id),deleteDevices:dList})
            })
            .catch(err=>{
                clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_005,{msg:err.message});
                console.log("\n+++ app.service.ts-88 ++++ ERROR:",err.message,"\n",err,"\n------------------\n")
            })
        }
    },

    {
        id:'loginByToken',
        ref:'api/login-by-token',
        handle(packet,client,network,service){
            const token=packet.payload.toString();
            service.userService.loginByToken(token).then(user=>{
                client.user=user;
                log("[%s] '%d' =>success (%s)",this.id,token,user.id);
                clientPublish(client,_TOPIC_RESPOND_DIRECT+"/login",_CODE_OK,user.token)
            })
            .catch(err=>{
                client.user=undefined;
                log("[%s] =>fail:",this.id,err.message);
                clientPublish(client,_TOPIC_RESPOND_DIRECT+"/login",_CODE_006);
            })
        }
    },

    {
        id:'login',
        ref:'api/login',
        handle(packet,client,network,service){
            try{
                const payload:{user:string,pass:string}=JSON.parse(packet.payload.toString());
                const {user,pass}=payload;
                if(!user ||!pass) throw new Error("data format error");
                service.userService.login(user,pass).then(user=>{
                    client.user=user;
                    const _sendUser=createObject(user,["id","lastLogin","level","token","name"])
                    clientPublish(client,_TOPIC_RESPOND_DIRECT,_CODE_OK,_sendUser);
                })
                .catch(err=>{throw err})
            }
            catch(err){
                log("007 [%s] =>failed!",this.id,err);
                clientPublish(client,_TOPIC_RESPOND_DIRECT+"/login",_CODE_007)
            }
        }
    }


    /** delete/remove device */
]


const appService:TopicService={
    type:'server',
    id:'app',
    topics,
}



export default appService;