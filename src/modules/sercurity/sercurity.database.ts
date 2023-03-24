import LocalDatabaseLite from "local-database-lite";

export default function sercurity(infor:any,database:LocalDatabaseLite){
    //1. input & verify
    if(!database) throw new Error("import database is wrong");
    //2. execute
    const db=database.connect("sercurity");
    //3. return
    return db;
}