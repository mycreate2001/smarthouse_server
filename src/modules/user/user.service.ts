// import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import Cryption from "../cryption/cryption";
import { UserData, UserDataExt, UserGroup, _DB_USER, _DB_USER_GROUP, createUser, createUserGroup } from "../../interface/user.interface";
import { JwtService } from "../jwt/service";
import { DataConnect, LocalDatabaseLite } from "local-database-lite";
import { UserServiceData } from "../../interface/user.interface";
import { createLog } from "advance-log";
import { group } from "console";

const _DEBUG=true;
const log=createLog("user service");
const _GROUP_DEFAULT="admin"
const _USER_DEFAULT="admin"
const _PASS_DEFAULT="admin"

export default class UserService implements UserServiceData{
    db:DataConnect<UserData>;
    groupDb:DataConnect<UserGroup>;
    cryption:Cryption
    jwt:JwtService;
    constructor(db:LocalDatabaseLite,cryption:Cryption,jwt:JwtService){
        this.jwt=jwt;
        this.cryption=cryption
        this.db=db.connect(_DB_USER);
        this.groupDb=db.connect(_DB_USER_GROUP);
        this._makeDefaultGroup().then(_=>this.makeDefaultUser())
    }
    async registerGroup(group: Partial<UserGroup> & { id: string; }): Promise<UserGroup> {
        try{
            const _db=await this.groupDb.get(group.id);
            if(_db) throw new Error("group already register");
            const _group=createUserGroup(group);
            return await this.groupDb.add(_group,true);
        }
        catch(err){
            log("ERROR: registerGroup is error\n\t",err);
            throw err;
        }
    }
   
    /** LOGIN SERVICE
     * the  `login` will return userdata if login success. throw error if login fail
     */
    async login(uid:string,pass:string):Promise<UserDataExt>{
        /** 1. check input */
        if(!uid||typeof uid!='string') throw new Error("Username invalid");
        if(!pass||typeof pass!=='string') throw new Error("Password invalid");
        /** 2. execute */
        const user=await this.db.get(uid);
        if(!user) throw new Error("username is not exist");
        const _pass=this.cryption?this.cryption.decrypt(user.pass):user.pass;
        if(pass!==_pass)throw new Error("username/password invalid");
        user.token=this.jwt.sign({uid},"REFRESH");
        user.lastLogin=Date.now();
        this.db.add(user,true);
        const {pubs,subs,name}=await this.groupDb.get(user.groupId)||createUserGroup();
        return {...user,group:name,pubs,subs}
    }

    async register(user:Partial<UserData>&{id:string,pass:string}):Promise<UserDataExt>{
        const id=user.id;
        const _user=await this.db.get(id)
        if(_user) throw new Error("username already register");
        user.pass=this.cryption.encrypt(user.pass)
        const nUser=createUser(user);
        nUser.token=this.jwt.sign({uid:id},"REFRESH");
        if(!nUser.groupId) nUser.groupId=_GROUP_DEFAULT;   /** default group */
        await this.db.add(nUser,true);
        const {name,subs,pubs}=await this.groupDb.get(nUser.groupId)||createUserGroup();
        return {...nUser,group:name,subs,pubs};
    }

    
    /**
     * login by token (refresh/accept token)
     * access token if the input token is a refresh token.
     * @param {string} token - A string representing the token that is used to authenticate the user.
     * @returns a Promise that resolves to an object of type UserData. The object contains user data
     * along with a access token property that may have been refreshed if the input token was a valid refresh
     * token.
     */
    async loginByToken(token:string):Promise<UserDataExt>{
        try{
            const result=this.jwt.verify(token);
            if(!result ||typeof result=='string') throw new Error("verify token error");
            const uid:string=result.uid;
            const user=await this.db.get(uid);
            if(!user) throw new Error("user is not exist");
            const {name,subs,pubs}=await this.groupDb.get(user.groupId)||createUserGroup()
            //token is access or refresh
            if(user.token===token){
                //refresh token
                const accessToken=this.jwt.sign({uid},"ACCESS");
                
                return {...user,token:accessToken,group:name,pubs,subs}
            }
            return {...user,token,group:name,pubs,subs}
        }
        catch(err){
            const msg=err instanceof Error?err.message:"other error"
            console.log("\n+++ user.service.ts-73 +++ loginByToken(%s)=>ERROR:",token,msg);
            throw err;
        }
    }


    /////////// private //////////////////////
    private makeDefaultUser(){
        this.db.search().then(users=>{
            if(users.length) return;
            this.register({id:_USER_DEFAULT,pass:_PASS_DEFAULT})
        })
    }
    private async  _makeDefaultGroup(){
        try{
            const groups=await this.groupDb.search();
            if(groups.length) return;
            this.registerGroup({id:_GROUP_DEFAULT,name:_GROUP_DEFAULT})
        }
        catch(err){
            log("ERROR: makedefault group is error\n\t",err);
            throw err;
        }
    }

}

