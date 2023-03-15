export interface ModuleInfor{
    id:string;          // id of module
    name:string;        // module name
    path:string;        // paht -- help load module
    params:any;         // parameters initals input when startup
    targets:string[];   // modules use curent module
    type:ModuleType;  
}

export interface ModulePackage extends ModuleInfor{
    module:any;
}

export type ModuleType ="network"|"database"|"service"
