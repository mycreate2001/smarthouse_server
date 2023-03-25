import { readFileSync, writeFileSync} from 'fs'
import { resolve } from 'path'

/** CONSTANT */
const _DEBUG=true;
const _CONFIG_FILE_NAME="config.ini"
const _STORAGE_="storage"
const _PATH_DEFAULT=resolve(_STORAGE_,_CONFIG_FILE_NAME);//require('../../../config.ts')
const _ISCOMMIT=false;

export default class Config{
    //variable
    private opts:ConfigOption={path:_PATH_DEFAULT,debug:_DEBUG}
    obj:any={}
    constructor(opts?:Partial<ConfigOption>){
        this.opts=Object.assign(this.opts,opts);
        this._readFile();
    }

    /** read object from file */
    private _readFile(){
        try{
            const str=readFileSync(this.opts.path,{encoding:'utf8'})
            console.log("config.ts TEST-001:",{str})
            const obj:any={};
            let item=""
            str.split("\r\n").forEach(data=>{
                data=data.trim();                                       //correct data
                if(!data.length) {item="" ;return}                      // remove empty row
                if(data.startsWith("#")||data.startsWith("//")) return; // remove comment
                if(data.startsWith("[")) {                                          // comment or new object
                    if(data.endsWith("]")) item=data.substring(1,data.length-2);    // new object [item]
                    return;                                                         // comment [xxxxx
                }
                //get value
                let [key,val]=data.split("=");
                key=key.trim();
                val=val||"";
                val=val.trim();
                if(!item) obj[key]=val;
                else {
                    if(!obj[item]) obj[item]={}
                    obj[item][key]=val;
                }
            })
            this.obj=obj;
            console.log("\n+++ config.ts-43 +++ obj:",obj);
        }
        catch(err){
            if(this.opts.debug) {
                const msg=err instanceof Error?err.message:"other error";
                console.log("[config/get] ### ERROR-001 ### ",msg);
                console.log("\n+++ config.ts-49 +++",err);
            }
            this.obj={}
        }
    }

    /** get data */
    get(key:string):string{
       return this.obj[key]
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