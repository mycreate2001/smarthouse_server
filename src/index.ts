import { ModuleLoader } from "./lib/module-loader";
import Config from 'configure'
console.clear();
console.log("\n\n\n\n+---------------------------------------+\n|\t\ttime:%s\n+--------------------------------------+\n",Date.now())
const configs=new Config();
process.env=configs.obj;//variable

const lModule=new ModuleLoader();
lModule.startup()
