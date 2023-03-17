import { resolve } from "path";
import { ModuleLoader } from "./lib/module-loader";
import { ModulePackage } from "./lib/module-loader/module.interface";
console.clear();
console.log("\n\n\n\n+++++++++++++++++++++++++++++++++++\ntime:%s\n------------------------------------------------------------------\n",Date.now())


const lModule=new ModuleLoader();
lModule.startup()
