import { ModuleInfor, ModulePackage } from "../../lib/module/module.interface";
import { toArray } from "../../lib/utility";
import {AuthenticateHandle} from '../interface.type'

export default function startup(infor:ModuleInfor,modules:ModulePackage[]){
    const coreModules=modules.filter(m=>toArray(infor.targets).includes(m.id))
    coreModules.forEach(core=>{
        const module=core.module
        const authenticate:AuthenticateHandle=(client,user,pass,callback)=>{
            pass=pass.toString();
            console.log("\n\n***** WELL DONE ********",{user,pass,client:client.id})
            callback(null,true);
        }
        module.authenticate=authenticate;
    })
}