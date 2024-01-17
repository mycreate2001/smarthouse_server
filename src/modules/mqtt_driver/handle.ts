import { createDebug } from "advance-log";
import { DriverServiceData } from "../../interface/driver.interface";
const debug=createDebug("mqtt driver",1);
export const handlers:DriverServiceData={
    connect:{
        name:"connect of device",
        ref:'tele/:eid/LWT',
        handler(client, packet, server, ref) {
            const topic=packet.topic
            debug(1,"lwt just get new messager %s \npacket\t",topic,packet)
        },
    }
}