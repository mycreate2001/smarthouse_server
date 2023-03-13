export interface ModuleInfor{
    id:string;
    name:string;
    path:string;
    params:any;
    parentId:string|string[];
    type:'input'|'handle'|'main';  //input = websocket or mqtt is input of network => it's will load before parent Module was loaded
                            //handle=handle for parent module, it's will loaded after parent module's loaded 
}

export interface ModulePackage extends ModuleInfor{
    module:any;
}
