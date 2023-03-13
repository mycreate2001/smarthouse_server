import { ModuleInfor, ModulePackage } from "../../interface";
import { toArray } from "../../lib/utility";
import {AuthenticateHandle} from '../interface.type'

export default function startup(infor:ModuleInfor,modules:ModulePackage[]){
    const coreModules=modules.filter(m=>toArray(infor.parentId).includes(m.id))
    coreModules.forEach(core=>{
        /**
         * authenticate:AuthenticateHandle=(client,user,pass,callback)=>callback(null,true);
            authorizeSubscribe:AuthorizeSubscribeHandle=(client,subscription,callback)=>callback(null,subscription);
            authorizePublish:AuthorizePublishHandle=(client,packet,callback)=>callback(null)
         */
        const module=core.module
        const authenticate:AuthenticateHandle=(client,user,pass,callback)=>{
            pass=pass.toString();
            console.log("\n\n***** WELL DONE ********",{user,pass})
            callback(null,true);
        }
        module.authenticate=authenticate;
    })
}