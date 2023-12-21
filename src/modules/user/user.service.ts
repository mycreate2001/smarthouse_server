import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import Cryption from "../cryption/cryption";
import { UserData } from "./user.interfac";
import { JwtService } from "../jwt/service";

const _DEBUG=true;
const _USER_DB_="users"
export default class UserService{
    db:DataConnect<UserData>;
    cryption:Cryption
    jwt:JwtService;
    constructor(db:LocalDatabaseLite,cryption:Cryption,jwt:JwtService){
        this.jwt=jwt;
        this.cryption=cryption
        this.db=db.connect(_USER_DB_)
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
        if(pass!==_pass)throw new Error("username/password invalid");
        user.token=this.jwt.sign({uid},"REFRESH");
        this.db.add(user,true);
        return user;
    }

    async register(user:Partial<UserData>&{id:string,pass:string}):Promise<UserData>{
        const id=user.id;
        const _user=await this.db.get(id)
        if(_user) throw new Error("username already register");
        user.pass=this.cryption.encrypt(user.pass)
        const nUser=createUser(user);
        nUser.token=this.jwt.sign({uid:id},"REFRESH");
        await this.db.add(nUser,true);
        return nUser;
    }

    
    /**
     * login by token (refresh/accept token)
     * access token if the input token is a refresh token.
     * @param {string} token - A string representing the token that is used to authenticate the user.
     * @returns a Promise that resolves to an object of type UserData. The object contains user data
     * along with a access token property that may have been refreshed if the input token was a valid refresh
     * token.
     */
    async loginByToken(token:string):Promise<UserData>{
        try{
            const result=this.jwt.verify(token);
            if(!result ||typeof result=='string') throw new Error("verify token error");
            const uid:string=result.uid;
            const user=await this.db.get(uid);
            if(!user) throw new Error("user is not exist");
            //token is access or refresh
            if(user.token===token){
                //refresh token
                const accessToken=this.jwt.sign({uid},"ACCESS");
                return {...user,token:accessToken}
            }
            return {...user,token}
        }
        catch(err){
            const msg=err instanceof Error?err.message:"other error"
            console.log("\n+++ user.service.ts-73 +++ loginByToken(%s)=>ERROR:",token,msg);
            throw err;
        }
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
    level:1,
    token:''
}

