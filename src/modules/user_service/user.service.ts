import { DataConnect } from "local-database-lite";
import {AuthenticateHandle} from '../interface.type'

export interface UserData{
    id:string;
    name:string;
    clientId:string;
    pass:string;
    lastLogin:string;
}

const userDefault:UserData={
    id:'',
    name:'',
    clientId:'',
    pass:'',
    lastLogin:''
}

export function createUserData(user:Partial<UserData>&{name:string,pass:string}):UserData{
    const xUser=Object.assign({},userDefault,{lastLogin:new Date().toISOString()},user)
    return xUser
}