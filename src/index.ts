import network from "./services/network";
console.clear();
network.on("client",(client:any)=>{
    console.log("!client connected");
    network.publish({topic:"client",payload:client.id})
})

network.subscribe("scribe",(packet:any)=>{
    console.log("\n*** index: TEST-001: Subscribe ***\n",{packet})
})