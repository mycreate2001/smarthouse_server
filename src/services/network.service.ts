import Socket from '../network/websocket';
import Mqtt from '../network/mqtt';
import Network from '../network/network';

/** configure network */
const socket=new Socket();
const mqtt=Mqtt();
const network=new Network(socket,mqtt);

export default network;
