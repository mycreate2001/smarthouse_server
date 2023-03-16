import { DataConnect } from "local-database-lite"
import { createLog } from "../../lib/log"
import { AuthenticateHandle } from "../interface.type"
import { UserData } from "../user_service/user.service"
const log=createLog("Sercurity","center")
export default class Sercurity{
    userDb:DataConnect<UserData>
    cryption:any
    constructor(userDatabase:DataConnect<UserData>,cryption:any){
        this.userDb=userDatabase;
        this.cryption=cryption
    }
    authenticate(){
        const that=this;
        console.log("**** sercurity.ts-14 start set authenticate")
        const authenticate:AuthenticateHandle=(client,uid,pass,callback)=>{
            console.log("**** sercurity.ts-16 checking")
            that.userDb.get(uid).then(dUser=>{
                if(!dUser) throw new Error("not exist user");
                pass=this.cryption.encrypt(pass.toString());
                if(pass!==dUser.pass)throw new Error("username/password invalid");
                log("%d login '%s' => successfully",client.id,uid);
                callback(null,true)
            })
            .catch(err=>{
                const msg=err instanceof Error?err.message:"other error"
                log("%d login '%s' => failured, msg:",client.id,uid,msg)
                callback(null,false);
            })
        }
        return authenticate
    }
}