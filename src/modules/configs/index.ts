import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import Config from "./configs";

export default function startupConfig(infor:ModulePackage,modules:InputModule){
    const path:string=(infor&& infor.params && infor.params.path)?infor.params.path:"../../../configure.ini"
    const configs=new Config({path});
    console.log("+++ [%s] startup debug +++ ",{path,configs})
    return configs;
}