export function toArray<T>(data:T|T[]):T[]{
    if(typeof data==undefined) return [];
    return Array.isArray(data)?data:[data]
}

export function shortID(id:string,n?:number):string{
    n=n||10;
    const n1=Math.floor((n-3)/2);//0123456789abcdef ,n=10 =>n1=(10-3)/2=3, str_0=0123...bcdef
    let str=id.substring(0,n1);
    str+="..."+id.substring(id.length-1-n1)
    return str;
}

export function shortMsg(msg:string|object,length?:number):string{
    //input
    const _msg:string=typeof msg=='string'?msg:JSON.stringify(msg);
    length=length||100;
    //handle
    return _msg.length>length?_msg.substring(0,length-3)+"...":_msg
}


/**
 * get parameter from topic
 * @param topic 
 * @param ref 
 * @returns 
 */
export function getParams(topic:string,ref:string){
    try{
        if(!topic||typeof topic!=='string') throw new Error("topic is invalid");
        if(!ref||typeof ref!=='string') throw new Error("ref is invalid");
        const aTopic=topic.split("/");
        const aRef=ref.split("/");
        const out:any={}
        aRef.forEach((key,pos)=>{
            if(!key.startsWith(":")) return;
            key=key.substring(1);
            out[key]=aTopic[pos];
        })
        return out;
    }
    catch(err){
        console.log("\n[getParamFromPath] ### ERROR ###\n\t",err);
        return {}
    }
}

export function getList(arrs:any|any[],key:string='id'):string[]{
    const list:string[]=[]
    toArray(arrs).forEach(arr=>{
        const val=arr[key]+""
        if(!list.includes(val)) list.push(val)
    })
    return list;
}

export function createOption<T extends {id:string}>(df:T,opts:Partial<T>):T{
    return Object.assign({},df,opts);
}

export function objParser(obj:any,items:string[]):any|undefined|void{
    if(!obj || typeof obj!=='object') return;//nothing
    let out:any=obj;
    const result=items.every(key=>{
        out=out[key];
        if(out==undefined) return false;
        return true;
    })
    if(result) return out;
}


export type KeyOfType<T>=keyof T 
export function createObject<T extends {}>(obj:T,list:KeyOfType<T>[]):any{
    const out:any={};
    Object.keys(obj).forEach(key=>{
        const val=(obj as any)[key]
        out[key]=val
    })
    return out;
}