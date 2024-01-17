export const _DB_SERCURITY="sercurities"
export interface Sercurity{
    id:string;          // id of sercurity
    name:string;        // name of function
    lock:boolean;       // true=lock, false=unlock
    subs:string[];      // enable subscribe
    pubs:string[];      // enable publishers
}