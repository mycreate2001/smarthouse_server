import { createLog } from "advance-log";
import { DriverHook, DriverHookDb, DriverPacket } from "../../interface/device-service.interface";
import { CommonDriverService } from "../../interface/device.interface";
import { CommonClient, Packet, CommonNetwork } from "../../interface/network.interface";
import UserService from "../user/user.service";

const API_key="api/v1"
const _TYPE="socket-v1"
const _NETWORK_IDs=["websocket"]
const APIs={
    login:'login'
}
const log=createLog(_TYPE)

function createService(userService:UserService):DriverHookDb{
    return {
        login:{
            type: "login",
            ref: API_key+"/"+APIs.login,
            handler: function (client: CommonClient, packet: Packet, infor: DriverHook, driverService: CommonDriverService, network: CommonNetwork) {
                const payload=packet.payload;
                log("test-001", {payload,userService})
            }
        }
    }
}

/////////// MAIN FUNCTIONS ////////////////
export default function startup(inf:any,userService:UserService):DriverPacket{
    return {services:createService(userService),type:_TYPE,networkIds:_NETWORK_IDs,control:{}}
}