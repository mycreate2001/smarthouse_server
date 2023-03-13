import * as CryptoJs from 'crypto-js'
export class Cryption{
    mainkey:string=''
    constructor(mainkey:string){
        this.mainkey=mainkey;
    }
    encryptAES(payload:string):string{
        return CryptoJs.AES.encrypt(payload,this.mainkey).toString()
    }

    decryptAES(payload:string):string{
        return CryptoJs.AES.decrypt(payload,this.mainkey).toString(CryptoJs.enc.Utf8)
    }
}

const _MAIN_KEY="thanhIM@"

export default new Cryption(_MAIN_KEY);