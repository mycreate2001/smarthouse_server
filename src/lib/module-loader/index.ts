import { rmdirSync } from 'fs';
import LocalDatabase,{DataConnect} from 'local-database-lite'
import { ModulePackage } from './module.interface';
import { createLog } from '../log';
import { wildcard } from '../wildcard';
const _ISCOMMIT=true
const _DEBUG=false
const log=createLog("Module","center",_DEBUG)
export interface ModuleStorage{
    [key:string]:ModulePackage &{status:string}
}
export class ModuleLoader {
    db:DataConnect<ModulePackage>;
    Modules:ModuleStorage={}    //result & status after loading module
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
        const list:string[]=[]
        let isDone=false;
        while(!isDone){
            let module=this._getNext(modules,list);
            if(!module) {isDone=true}
            else{
                this.loadModule(module,modules,list)
            }
        }
        return modules;
    }

    /** load each module */
    private loadModule(module:ModulePackage,modules:ModulePackage[],list:string[]){
        if(list.includes(module.id)) return module;
        log("start %s [%d]",module.id,module.level)
        // //filter by level
        // let preModules:ModulePackage[]=modules.filter(m=>m.level<module.level);
        let preModules:ModulePackage[]
            =Object.keys(module.imports).some(key=>wildcard(module.keys,module.imports[key]))?
            modules.filter(m=>m.level<module.level)
            :modules
        // let preModules:ModulePackage[]=modules; //no filter by level
        const ips:any={};
        // console.log("module-loeader/index.ts-51 ",module)
        Object.keys(module.imports).forEach(ipKey=>{
            // ips[key]= something
            const ref=module.imports[ipKey]
            // console.log("module-loeader/index.ts-52 ",{ipKey,ref})
            // module is correct keys
            let _mds=preModules.filter(m=>wildcard(m.keys,ref))
            // get last level when same keys
            const objs:ModulePackage[]=[];//result
            _mds.forEach(_md=>{
                const key=_md.keys
                const pos=objs.findIndex(o=>o.keys==key);
                if(pos==-1) objs.push(_md);
                else if(objs[pos].level<_md.level) objs[pos]=_md
                // debug("step2.3.2 get objs/checkpoint",{objs})
            })
            ips[ipKey]=objs.map(m=>this.loadModule(m,modules,list));//modules
        })
        const fn=require(module.path).default;
        // console.log("+++ test function +++ \n",{type:typeof fn,fn,fnstr:fn.toString()})
        if(typeof fn=='function') module.module=fn(module,ips);
        list.push(module.id);
        log("finish %s [%d]",module.id,module.level)
        return module;
    }

    /** private */
    private _getNext(modules:ModulePackage[],list:string[]):ModulePackage|undefined{
        const result= modules.find(m=>!list.includes(m.id));
        return result;
    }

    
}

export interface LoadModuleOptions{
    modules:ModulePackage[],
    list:string[]
}