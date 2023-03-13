import db from './db'
import {uuid as uuidv4} from 'uuidv4'
import cryption from '../services/cryption.service'
const defaultUser=createUserData({id:'admin',name:"Administrator",level:4,pass:cryption.encryptAES("admin")})
export default db.connect("users",defaultUser)


/// interface
export interface UserData{
    id:string;
    name:string;
    level:number;
    token:string;
    lasttime:string;
    pass:string;
}

export function createUserData(user:Partial<UserData>&{pass:string}){
    const now=new Date();
    const id=user.id||uuidv4();
    const _df:UserData={id,name:id,level:1,token:'',lasttime:now.toISOString(),pass:''}
    return Object.assign(_df,user);
}
