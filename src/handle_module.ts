import { ModuleInfor, ModulePackage } from "./interface";
import { createLog } from "./lib/log";
import { toArray } from "./lib/utility";
const log=createLog("module-handle")
export default function loadAllModule(infors:ModuleInfor[]){
    const modules=infors.map(infor=>{return{...infor,module:null}})
    modules.forEach(module=>{
        const result=loadModule(modules,module);
        module.module=result.module;
    })
    return modules;
}

function loadModule(modules:ModulePackage[],module:ModulePackage){
    if(module.module) return module;
    const pre1=modules.filter(m=>(m.type=='input' && m.parentId==module.id));
    const pre2=module.type=='handle'?modules.filter(m=>toArray(module.parentId).includes(m.id)):[];
    const preModules:ModulePackage[]=[...pre1,...pre2].map(m=>loadModule(modules,m)).filter(x=>x)
    const fn=require(module.path).default;
    log("loaded %d\t// %s",module.id,module.name)
    if(typeof fn=='function') module.module=fn(module,preModules)
    else {
        module.module=1
        log("\n### ERROR ### load module is error",{module});
    }
    return module
}