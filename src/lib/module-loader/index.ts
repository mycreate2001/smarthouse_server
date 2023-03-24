import { rmdirSync } from 'fs';
import LocalDatabase,{DataConnect} from 'local-database-lite'
import { ModulePackage, toImportConfig } from './module.interface';
import { createLog } from '../log';
import { wildcard } from '../wildcard';
import { resolve } from 'path';
const _ISCOMMIT=true
const _DEBUG=true
const log=createLog("Module","center",_DEBUG)
export interface ModuleStorage{
    [key:string]:ModulePackage &{status:string}
}
export class ModuleLoader {
    db:DataConnect<ModulePackage>;
    Modules:ModuleStorage={}    //result & status after loading module
    constructor(path?:string){
        //handle path
        path=path||resolve("storage","database.json")
        const db=new LocalDatabase(path);
        this.db=db.connect("modules");
        // console.log("\n\n++++++++module-loader/index.js-21\nmodules:",this.db.search())
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
                /** check error */
                try{
                    this.loadModule(module,modules,list);
                }
                catch(err){
                    const msg=err instanceof Error?err.message:"other error"
                    log("%s load failed!, #### ERROR:",module.id,msg);
                    console.log(err,"------------\n");
                    list.push(module.id)
                }
            }
        }
        return modules;
    }

    /** load each module */
    private loadModule(module:ModulePackage,modules:ModulePackage[],list:string[]){
        if(list.includes(module.id)) return module;
        log("%s load",module.id)
        // //filter by level
        let preModules:ModulePackage[]=modules.filter(m=>m.level<module.level);
        /** ips={database:xxxx,services:[xxxx]} */
        const ips:any={}; // inputsmodule
        /** for each key */ 
        Object.keys(module.imports).forEach(imports_keys=>{
            // ips[key]= something
            const _import=toImportConfig(module.imports[imports_keys])
            // module is correct keys
            let _mds=preModules.filter(m=>wildcard(m.keys,_import.ref))
            // get top level when same keys
            const objs:ModulePackage[]=[];//result
            _mds.forEach(_md=>{
                const keys=_md.keys
                const pos=objs.findIndex(o=>o.keys==keys);
                if(pos==-1) objs.push(_md);
                else if(objs[pos].level<_md.level) objs[pos]=_md
            })
            //new revise
            if(_import.type=='array')
                ips[imports_keys]=objs.map(m=>this.loadModule(m,modules,list).module);//modules
            else if(_import.type=='single')
                ips[imports_keys]=this.loadModule(objs[0],modules,list).module
            else ips[imports_keys]=null;
        })
        //calculate imports modules
        const fn=require(resolve("dist","modules",module.path)).default;
        if(typeof fn=='function') module.module=fn(module,...Object.keys(ips).map(key=>ips[key]));
        list.push(module.id);
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