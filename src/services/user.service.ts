import { createLog } from '../lib/log'
import userDb,{UserData} from '../db/user.model'
import cryption from './cryption.service'
const _DEBUG=false
const log=createLog("user.service","center",_DEBUG)
class UserService{
    constructor(){}
    /**
     * 
     * @param uid username
     * @param pass password
     * @returns result of login user/null=success/faled
     */
    async login(uid:string,pass:string):Promise<UserData|null>{
        try{
            if(!uid||typeof uid!=='string') throw new Error("username invalid")
            if(!pass||typeof pass!=='string') throw new Error("password invalid")
            const user=await userDb.get(uid);
            if(!user) throw new Error("Not exist username");
            log("login: user:%s ==>success",uid)
            return user;
        }
        catch(err){
            const msg:string=err instanceof Error?err.message:"other error"
            log("login: user:%s,pass:%s ==>### ERROR:%s",uid,pass,msg)
            return null
        }
    }

    /**
     * 
     * @param user user information
     * @returns error message
     */
    register(user:UserData):Promise<string>{
        return userDb.get(user.id).then(xUser=>{
            if(xUser) throw new Error("already register");
            const pass=cryption.encryptAES(user.pass);
            return userDb.add({...user,pass},true)
        })
        .then(user=>"")
        .catch(err=>{
            const msg:string=err.message||"other error"
            return msg;
        })
    }
}

export default new UserService();