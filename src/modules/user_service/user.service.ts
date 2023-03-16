import { DataConnect } from "local-database-lite";
import { createLog } from "../../lib/log";
import Cryption from "../cryption/cryption";
import {AuthenticateHandle} from '../interface.type'

const _DEBUG=true;
const log=createLog("UserService","center",_DEBUG)
export interface UserData{
    id:string;
    name:string;
    clientId:string;
    pass:string;
    lastLogin:string;
    level:number
}


export default class UserService{
    db:DataConnect<UserData>;
    cryption:Cryption
    constructor(db:DataConnect<UserData>,cryption:Cryption){
        this.db=db;
        this.cryption=cryption
        this.makeDefaultUser();

    }
    private makeDefaultUser(){
        this.db.search().then(users=>{
            if(users.length) return;
            this.register({id:'admin',pass:'admin',level:10})
        })
    }
    async login(uid:string,pass:string):Promise<UserData>{
        if(!uid||typeof uid!='string') throw new Error("Username invalid");
        if(!pass||typeof pass!=='string') throw new Error("Password invalid");
        const user=await this.db.get(uid);
        if(!user) throw new Error("username is not exist");
        const _pass=this.cryption?this.cryption.decrypt(user.pass):user.pass;
        if(pass!==_pass){
            throw new Error("username/password invalid");
        } 
            
        return user;
    }

    async register(user:Partial<UserData>&{id:string,pass:string}):Promise<UserData>{
        const id=user.id;
        const _user=await this.db.get(id)
        if(_user) throw new Error("username already register");
        user.pass=this.cryption.encrypt(user.pass)
        const nUser=createUser(user);
        await this.db.add(nUser,true);
        return nUser;
    }

    authenticate(){
        const authenticate:AuthenticateHandle=async (client,uid,pass,callback)=>{
            try{
                const user=await this.login(uid,pass.toString());
                log("%d login %s => success!",client.id,uid)
                callback(null,true)
            }
            catch(err){
                const _err:Error=err instanceof Error?err:new Error("other error")
                log("%d login %s =>failred! #%s",client.id,uid,_err.message)
                callback(_err,false)
            }
        }
        return authenticate;
    }
}

/////////////// SMALL FUNCTIONS //////////////////
export function createUser(user:Partial<UserData>):UserData{
    const lastLogin=new Date().toISOString();
    return Object.assign({},userDefault,{lastLogin},user)
}

/////////////// INTERFACES ///////////////////////
const userDefault:UserData={
    id:'',
    name:'',
    clientId:'',
    pass:'',
    lastLogin:'',
    level:1
}

