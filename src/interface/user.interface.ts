import { createOption, uuid } from "ultility-tools";

export const _DB_USER="users"
export interface UserData{
    id:string;              // uid
    name:string;            // name
    clientId:string;        // it's usefull with device account
    pass:string;            // password (It's encryption information)
    lastLogin:number;       // last times login
    token:string;           // current token
    groupId:string;         //  UserGroup ID
}

export interface UserDataExt extends UserData{
    group:string;           // name of group
    subs:string[];          // subscribe list
    pubs:string[];          // publish list
}

export const _DB_USER_GROUP="groups"
export interface UserGroup{
    id:string;              // id
    name:string;            // group name
    subs:string[];          // allow subscribe functions
    pubs:string[];          // allow pubish functions
}


export interface UserServiceData{
    login(uid:string,pass:string):Promise<UserDataExt>
    register(user:Partial<UserData>&{id:string,pass:string}):Promise<UserDataExt>;
    registerGroup(group:Partial<UserGroup>&{id:string}):Promise<UserGroup>
    loginByToken(token:string):Promise<UserDataExt>;

}

////////////// FUNCTIONS //////////////////

/** create user data */
export function createUser(opt:Partial<UserData>={}):UserData{
    const now=Date.now();
    const id=uuid();
    const df:UserData={
        id,
        name:id,
        clientId: "",
        pass: "",
        lastLogin:now ,
        token: "",
        groupId: ""
    }
    return createOption(df,opt)
}

/** create user group */
export function createUserGroup(opts:Partial<UserGroup>={}):UserGroup{
    const id=uuid();
    const df:UserGroup={
        id,
        name: id,
        subs: [],
        pubs: []
    }
    return createOption(df,opts)
}