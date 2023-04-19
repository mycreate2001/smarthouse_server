import { DatabaseType } from "./interface";

export class TemporaryDatabase<T extends {id:string}>{
    db:DatabaseType<T>={};
    constructor(db?:T[]){
        if(db && db.length){
            db.forEach(d=>this.add(d))
        }
    }
    /** add new database */
    add(data:T):T{
        const id=data.id;
        this.db[id]=data;
        return data;
    }

    /**
     * get 1 result
     * @param id id/some part of record
     * @returns 
     */
    get(id:string|Partial<T> &{id:string}):T|undefined{
        if(!id) {
            console.log("\n+++ [temporary-database] ERROR-001: wrong format",{id});
            return 
        }
        const _id=typeof id=='string'?id:id.id;
        if(!_id) {
            console.log("\n+++ [temporary-database] ERROR-002: wrong format",{id,_id});
            return
        }
        return this.db[_id];
    }

    /**
     * update database follow new data
     * @param data new part of information (aways include id)
     * @returns new record
     */
    update(data:Partial<T>&{id:string}):T{
        const id=data.id;
        const db=this.db[id]||{}
        this.db[id]={...db,...data}
        return this.db[id]
    }


    /**
     * search database have same key of obj
     * @param obj search condition
     * @returns 
     */
    search(obj:any):T[]{
        if(!obj||!Object.keys(obj).length||typeof obj!=='object') return [];// error
        const dbs=this.all();
        return dbs.filter(db=>Object.keys(obj).every(key=>(db as any)[key]===obj[key]))
    }

    /**
     * get all database
     * @returns 
     */
    all():T[]{
        return Object.keys(this.db).map(key=>this.db[key])
    }
}