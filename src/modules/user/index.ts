import UserService from "./user.service";

export default function startupUserService(infor:any,db:any,hash:any,jwt:any){
    //1. check & verify
    if(!db) throw new Error("load database error")
    if(!hash) throw new Error("load hash is failred!")
    
    //2. execute
    const service=new UserService(db,hash,jwt);
    return service;
}