import { readFileSync } from "fs";
import { join } from "path"
import { createLog } from "advance-log";
import { ModulePackage } from "./module.interface";

const _PACKAGE="package.json"
export function getModuleInfor(dir:string):ModulePackage|null{
    const log=createLog("getInfor","center")
    const _path=join(dir,_PACKAGE);
    try{
        const str=readFileSync(_path,{encoding:'utf8'})
        const obj=JSON.parse(str);
        const infor:ModulePackage={
            path:join(dir,obj.main),
            id:obj.name,
            name:obj.description ||obj.name ,
            params:obj.params||{},
            imports:obj.imports||{},
            keys:obj.keys||"",
            level:obj.level||0,
            module:null
        }
        return infor;
    }
    catch(err){
        const msg:string=err instanceof Error?err.message:"other error"
        log("\n### ERROR[1]: failred! #%s",msg);
        return null;
    }
}