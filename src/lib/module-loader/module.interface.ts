export interface ModuleInfor{
    id:string;          // id of module
    name:string;        // module name
    path:string;        // paht -- help load module
    params:any;         // parameters initals input when startup
    imports:ImportData;        // modules use curent module
    keys:string;        // like topic 
    level:number;
}

export interface ModulePackage extends ModuleInfor{
    module:any;
}

export type ModuleType ="network"|"database"|"service"
export interface ImportData{
    [key:string]:string
}

export interface InputModule{
    [key:string]:ModulePackage[]
}