import { shortID, shortMsg } from "../lib/utility"

const str="0123456789ABCDEF"
console.log("shortID:",shortID(str));
console.log("shortMsg[15]:",shortMsg(str,15))
console.log("shortMsg[16]:",shortMsg(str,16))
console.log("shortMsg[10]:",shortMsg(str,10))