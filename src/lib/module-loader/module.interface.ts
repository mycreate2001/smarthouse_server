export interface ModulePackage{
    id:string;          // id of module
    name:string;        // module name
    path:string;        // paht -- help load module
    params:any;         // parameters initals input when startup
    imports:ImportData;        // modules use curent module
    keys:string;        // like topic 
    level:number;
    module:any;
}

export type ModuleType ="network"|"database"|"service"
export interface ImportData{
    [key:string]:string|ImportConfig
}

export interface InputModule{
    [key:string]:ModulePackage[]
}

export interface ImportConfig{
    ref:string;
    type:ImportConfigType;
}

export type ImportConfigType="array"|"single"

/**
 * convert string/ImportConfig to ImportConfig
 * Note: it's can make error when data is not correctly
 * @param importCf
 * @returns 
 */
export function toImportConfig(importCf:string|ImportConfig):ImportConfig{
    if(typeof importCf=='string') return {ref:importCf,type:'single'}
    if(!importCf.ref||!importCf.type) throw new Error("import config data is wrong")
    return importCf;
}