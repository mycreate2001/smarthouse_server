import { createLog } from "../../lib/log";
import { InputModule, ModuleInfor } from "../../lib/module-loader/module.interface";
import Sercurity from "./sercurity";
export default function startup(infor:ModuleInfor,modules:InputModule){
    const log=createLog(infor.id.toUpperCase(),"center")
    //input & verify
    const networks=modules.network.map(m=>m.module);
    const userModule=modules.user_database;
    const cryptionModule=modules.cryption;
    if(!networks.length||!userModule||!userModule.length||!cryptionModule||!cryptionModule.length) {
        log("### ERROR[1]: [%s] startup failured",infor.id)
        return false;//setting wrong
    }

    //execute
    const cryption=cryptionModule[0].module
    const sercurity=new Sercurity(userModule[0].module,cryption)
    networks.forEach(network=>{
        // network.authenticate=sercurity.authenticate();//authenticate
        network.setAuthenticate(sercurity.authenticate())
    })
    return true;
}