import Socket from '../network/websocket';
import Mqtt from '../network/mqtt';
import Network from '../network/network';
import { AuthenticateHandle } from '../network/interface.type'
const auth:AuthenticateHandle=(client,user,pass,callback)=>{
    pass=pass.toString();
    if(user!=='admin'||pass!=='admin') {
        console.log("service/networs.ts ++++ TEST-002 ++++\nlogin falured",{user,pass})
        return callback(new Error("user/pass is invalid!"),false);
    }
    console.log("service/networs.ts ++++ TEST-003 ++++\nlogin success",{user,pass})
    callback(null,true)
}
/** configure network */
const socket=new Socket();
const mqtt=Mqtt();
const network=new Network(socket,mqtt);

network.setAuthenticate(auth);
network.setAuthSubscribe((client,subscription,callback)=>{
    console.log("### service/network.js TEST-001 ###\n",{subscription});
    callback(null,subscription)
})

network.setAuthPublish((client,packet,callback)=>{
    const topic=packet.topic;
    if(topic=='test') return callback(new Error("test result"))
    return callback(null);
})
export default network;
