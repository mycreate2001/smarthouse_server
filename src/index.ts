import { PublishPacket } from "packet";
import { createLog } from "./lib/log";
import network from "./services/network";
const log=createLog("main","center");
console.clear();

// network.subscribe("scribe",(packet:any)=>{
//     console.log("\n*** index: TEST-001: Subscribe ***\n",{packet})
// })

network.on("publish",(packet:PublishPacket,client:any)=>{
    if(packet.cmd!='publish') return;
    log("publish",{packet})
})
