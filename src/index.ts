import { ModuleLoader } from "module-loader";
console.clear();

const md=new ModuleLoader("storage","database");
md.startup("dist","modules");
