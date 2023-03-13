/** import */
import { PublishPacket } from "packet";
import { createLog } from "./lib/log";
import network from "./services/network.service";
import userService from "./services/user.service";
const log=createLog("main","center");


// network.subscribe("scribe",(packet:any)=>{
//     console.log("\n*** index: TEST-001: Subscribe ***\n",{packet})
// })

network.on("publish",(packet:PublishPacket,client:any)=>{
    if(packet.cmd!='publish') return;
    log("publish",{packet})
})

network.setAuthenticate((client,user,pass,callback)=>{
    const _pass=pass.toString()
    userService.login(user,_pass).then(xUser=>{
        if(!xUser) throw new Error("username not exist")
        log("setAuthenticate: %s login with user:%s => success",client.id,user)
        callback(null,true)
    })
    .catch(err=>{
        log("setAuthenticate: %s login {user:%s,pass:%s} =>failure(%s)",client.id,user,pass,err.message)
        callback(err,false);
    })
})