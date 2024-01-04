import { resolve } from "path";
import Config from 'configure';
import { ModulePackage } from "module-loader/interface";

///////// constant ////////////////
const _PATH_DEFAULT=resolve("configure.ini");

////// function ///////////////////
export default function startupConfig(infor:ModulePackage){
    //1. input & verify
    const path:string=(infor.params.path)?infor.params.path:_PATH_DEFAULT
    //2. execute
    const configs=new Config({path});
    // console.log("\n+++ configs.index.ts-10 ",configs.obj);
    return configs;
}