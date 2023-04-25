import Cryption from "./cryption";
const _MAIN_KEY="thanhIM"
export default function CryptionStatup(infor:any){
    //1. input & verify
    
    //2. execute
    const key:string=process.env._MAIN_KEY ||_MAIN_KEY
    const cryption=new Cryption(key);
    return cryption;
}