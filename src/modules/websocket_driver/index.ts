import { _DB_DEVICE } from "../../interface/device.interface";
import SocketDriver from "./socket-driver.service";

// import {socketDriverServices,runSocketDriver} from './socket-driver.service'
export default function startup(inf:any,ws:any,dbase:any){
    const db=dbase.connect(_DB_DEVICE);
    const driver=new SocketDriver({server:ws,db});
    return driver;
}