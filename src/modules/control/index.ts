import { ModulePackage } from "../../lib/module-loader/module.interface";
import Network from "../network/network";
import { Control } from "./control.service";

export default function control(infor:ModulePackage,network:any,db:any,config:any){
    // 1. input & verify
    if(!network) throw new Error("network error");
    if(!db) throw new Error("database error");
    if(!config) throw new Error("configure error");

    //2. execute
    const control=new Control(network,db,config);
    //3. return
    return control
}