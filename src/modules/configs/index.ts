import { resolve } from "path";
import { ModulePackage } from "../../lib/module-loader/module.interface";
import Config from 'configure';
const _PATH_DEFAULT=resolve("configure.ini");
export default function startupConfig(infor:ModulePackage){
    //1. input & verify
    const path:string=(infor.params.path)?infor.params.path:_PATH_DEFAULT
    //2. execute
    const configs=new Config({path});
    console.log("\n+++ configs.index.ts-10 ",configs.obj);
    return configs;
}