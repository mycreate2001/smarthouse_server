import LocalDatabaseLite from "local-database-lite";

export default function startup(infor:any,database:LocalDatabaseLite){
    //1. input & verify
    if(!database) throw new Error("database error")

    //2. execute
    const db=database.connect("devices");
    return db;
}