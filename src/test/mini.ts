/** test shortID, shortMsg */
// import { shortID, shortMsg } from "../lib/utility"
// const str="0123456789ABCDEF"
// console.log("shortID:",shortID(str));
// console.log("shortMsg[15]:",shortMsg(str,15))
// console.log("shortMsg[16]:",shortMsg(str,16))
// console.log("shortMsg[10]:",shortMsg(str,10))

/** user */
import user from '../db/user.model'

user.add({id:'123',name:'Thanh',level:0,token:'',lasttime:'',pass:''},true);
user.search().then(users=>{
    console.log("test-001: users",users)
})