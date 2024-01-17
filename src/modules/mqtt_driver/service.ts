import Aedes from "aedes";
import { CommonDriverList, CommonDriverService, Device } from "../../interface/device.interface";
import { handlers } from "./handle";
import { intDriver } from "../../interface/driver.interface";
import { CommonNetwork } from "../../interface/network.interface";

export default class MqttDriverService implements CommonDriverService{
    constructor(private server:CommonNetwork){
        intDriver(handlers,this.server)
    }

    remote(device: Device): void {
        throw new Error("Method not implemented.");
    }
    update(device: Device): void {
        throw new Error("Method not implemented.");
    }
    getServices(): CommonDriverList[] {
        throw new Error("Method not implemented.");
    }

}
