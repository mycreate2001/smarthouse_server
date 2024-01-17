import { createDebug, createLog } from "advance-log";
import UserService from "../user/user.service";
import { CommonNetwork } from "../../interface/network.interface";
import { wildcard } from "ultility-tools";
import { SocketExt } from "../socket-service/socket.service";
import SocketDriver from "../websocket_driver/socket-driver.service";
import { Sercurity } from "../../interface/sercurity.interface";

const _ALLOW_NEW_LINK: DecideNewLink = 'reject'     // allow new link (not incude service)
const _APP_LABEL="socket sercurity";                // application name (label)

const debug = createDebug(_APP_LABEL, 1);
const log=createLog(_APP_LABEL,{align:"center",enablePos:true})

type DecideNewLink = "accept" | "reject"


export interface SocketSercurityOpts {
    newlink: DecideNewLink
}

export default function socketSercurity(socket: CommonNetwork,driver:SocketDriver, userService: UserService, opts: Partial<SocketSercurityOpts> = {}) {
    const newLink = opts.newlink || _ALLOW_NEW_LINK
    const services=driver.getServices();

    /** login */
    socket.authenticate = async (client, uid, pass, cb) => {
        try {
            const user = await userService.login(uid, pass);
            client.user = user;
            log("login success ",{uid,pass})
            cb(null, true);
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : "other"
            debug(1, "ERROR: login failured %s", msg)
            cb(err, false);
        }
    }

    /** publish authorization */
    socket.authorizePublish = (client, packet, cb) => {
        const topic = packet.topic;
        const user=client.user;

        try {
            //no topic => block
            if (!topic) throw new Error("no topic");
            // not yet login => block
            if(!user) throw new Error("Not yet login");

            const sercurities=driver.getServices().filter(s=>s && wildcard(topic,s.ref))
            // new link (not yet inside service)
            if (!sercurities.length) {
                if (newLink == 'reject') throw new Error("new link =>reject");
                log("%d publish %s =>success, note:%s",client.id,topic,"new link");
                return cb(null);        // pass
            }
   

            const success = sercurities.every(ser => {
                //group name include sercurity function => OK
                if (!user.pubs.includes(ser.id)){
                    debug(1,"denied ",{user});
                    return false
                }
                return true;
            })
            debug(2,"### test-002");
            if(!success) throw new Error("accept denied");
            //success
            log("%d publish %s success",client.id,topic);
            cb(null)
        }
        catch (err) {
            const msg=err instanceof Error?err.message:"other"
            log("%d publish %s =>failed '%s'",client.id,topic,msg);
            const close=(client as any).close
            if(close && typeof close==='function') close(1);
            return false;
        }


    }

    /** subscribe authorization */

}