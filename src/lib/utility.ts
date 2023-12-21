/**
 * The function converts a single value or an array of values to an array.
 * @param {T|T[]} data - The parameter `data` is of type `T | T[]`, which means it can either be a
 * single value of type `T` or an array of values of type `T`. The function `toArray` converts this
 * input into an array of type `T[]`.
 * @returns The function `toArray` returns an array of type `T[]`. If the input `data` is `undefined`,
 * an empty array is returned. If `data` is already an array, it is returned as is. Otherwise, `data`
 * is wrapped in an array and returned.
 */
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
 * The function takes in a topic and a reference string, splits them into arrays, and returns an object
 * with key-value pairs where the keys are extracted from the reference string and the values are taken
 * from the corresponding positions in the topic array.
 * @param {string} topic - A string representing a topic that contains values separated by forward
 * slashes ("/").
 * @param {string} ref - ref is a string parameter that represents a reference path.
 * @returns an object containing key-value pairs where the keys are extracted from the `ref` string and
 * the values are extracted from the `topic` string based on their positions. If there is an error, an
 * empty object is returned.
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

/**
 * The function takes an array of objects and returns an array of unique values for a specified key in
 * those objects.
 * @param {any|any[]} arrs - An array of objects or a single object.
 * @param {string} [key=id] - The key parameter is a string that specifies the property name of the
 * objects in the array that should be used to create the list. By default, it is set to 'id'.
 * @returns an array of strings, which contains unique values of a specific property (specified by the
 * `key` parameter) from an array or an array of objects (specified by the `arrs` parameter).
 */
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
    list.forEach(key=>{
        const val=(obj as any)[key]
        out[key]=val
    })
    console.log("\n+++ utility.ts-105 [creteObject] ",{obj,out,list})
    return out;
}