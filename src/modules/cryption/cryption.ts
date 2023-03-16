import * as CryptoJS from 'crypto-js'
export default class Cryption{
    key:string
    constructor(mainKey:string){
        this.key=mainKey
    }
    decrypt(text:string){
        return CryptoJS.AES.decrypt(text,this.key).toString(CryptoJS.enc.Utf8)
    }
    encrypt(text:string){
        return CryptoJS.AES.encrypt(text,this.key).toString()
    }
}