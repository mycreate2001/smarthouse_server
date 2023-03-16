import { join } from "path";
import { ModuleLoader } from "./lib/module-loader";
console.clear();
console.log("\n\n\n\n+++++++++++++++++++++++++++++++++++\ntime:%s\n------------------------------------------------------------------\n",Date.now())


const path=join(__dirname,"..","storage","database.json");
const lModule=new ModuleLoader(path);
const control:any={}
lModule.startup();