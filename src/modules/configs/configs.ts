import { readFileSync, writeFileSync} from 'fs'
import {join} from 'path'

/** CONSTANT */
const _DEBUG=true;
const _CONFIG_FILE_NAME="config.ini"
const _PATH_DEFAULT=join(__dirname,"..","..","..","..",_CONFIG_FILE_NAME)
const _ISCOMMIT=false;

export default class Config{
    //variable
    opts:ConfigOption={path:_PATH_DEFAULT,debug:_DEBUG}
    obj:any={}
    constructor(opts?:Partial<ConfigOption>){
        this.opts=Object.assign(this.opts,opts);
        try{
            const str=readFileSync(this.opts.path,{encoding:'utf8'})
            const obj:any={};
            str.split("\r\n").forEach(data=>{
                if(data.startsWith("#")||data.startsWith("//")) return;//[//,#] remove comment #
                let [key,val]=data.split("=");
                key=key.trim();
                val=val||"";
                val=val.trim();
                obj[key]=val;
            })
            this.obj=obj;
        }
        catch(err){
            if(this.opts.debug) {
                const msg=err instanceof Error?err.message:"other error";
                console.log("[config/get] ### ERROR-001 ### ",msg);
            }
            this.obj={}
        }
    }
    get(){
       return this.obj
    }
    add(obj:any,iscommit:boolean=_ISCOMMIT){
        Object.keys(obj).forEach(key=>{
            this.obj[key]=obj[key]||""
        })
        if(iscommit) this.write();
    }

    /**
     * 
     * @returns true/false=success/failed
     */
    write(){
        //data
        const str=Object.keys(this.obj).map(key=>{
            return [key,this.obj[key]].join("=")
        }).join("\r\n")
        //write
        try{
            writeFileSync(this.opts.path,str,{encoding:'utf8'});
            return true;
        }
        catch(err){
            if(this.opts.debug){
                const msg=err instanceof Error?err.message:"other error"
                console.log("[config/write] ### ERROR ### ",msg);
                return false;
            }
        }
    }
}


///// INTERFACES ///////////////////
export interface ConfigOption{
    path:string;
    debug:boolean
}