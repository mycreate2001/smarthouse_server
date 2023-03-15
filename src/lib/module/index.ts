import { rmdirSync } from 'fs';
import LocalDatabase,{DataConnect} from 'local-database-lite'
import { ModulePackage } from './module.interface';
import { createLog } from '../log';
import { toArray } from '../utility';
const log=createLog("Module","center")
const _ISCOMMIT=true
export class ModuleLoader {
    db:DataConnect<ModulePackage>
    constructor(path:string){
        const db=new LocalDatabase(path);
        this.db=db.connect("modules");
    }
    add(module:ModulePackage,isCommit:boolean=_ISCOMMIT){
        this.db.add(module,isCommit);
    }

    remove(module:ModulePackage){
        const path=module.path;
        rmdirSync(path)
        this.db.delete(module.id);
    }

    async startup(){
        const modules=await this.db.search();
        let isDone=false;
        const list:string[]=[];
        while(!isDone){
            let module=this._getNext(modules,list);
            if(!module) {isDone=true}
            else{
                const result=loadModule(modules,module,list)
                module.module=result.module;
            }
        }
        return modules;
    }

    /** private */
    private _getNext(modules:ModulePackage[],list:string[]):ModulePackage|undefined{
        const result= modules.find(m=>!list.includes(m.id));
        return result;
    }

    
}


function loadModule(modules:ModulePackage[],module:ModulePackage,list:string[]){
    if(list.includes(module.id)) return module;
    const pre=modules.filter(m=>m.targets.includes(module.id));
    const preModules:ModulePackage[]=pre.map(m=>loadModule(modules,m,list))
        .filter(x=>!!x)
    const fn=require(module.path).default;
    
    if(typeof fn=='function') {
        log("loaded %d",module.id)
        module.module=fn(module,preModules)
    }
    else {
        log("\n### ERROR ### load module '%d' is error",module.id);
        module.module=undefined;
    }
    //update list
    [...preModules,module].map(m=>m.id).forEach(id=>{
        if(list.includes(id)) return;
        list.push(id)
    })
    return module
}