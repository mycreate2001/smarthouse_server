import * as jwt from 'jsonwebtoken'
import { JwtServiceCommon, JwtSignFunc, JwtSignFuncType, JwtVerifyFunc } from './interface';
const _MAIN_KEY="thanh@"
const _TOKEN_EXP={"ACCESS":60*5,"REFRESH":'30d'}
export class JwtService implements JwtServiceCommon{
    key:string=''
    constructor(){
        this.key=process.env.CRYPTION_MAIN_KEY||_MAIN_KEY;
    }

    sign(data: object , type: JwtSignFuncType): string {
        const expiresIn='1d';//_TOKEN_EXP[type];
        console.log("\n+++ jwt.service.ts-13 +++ expiresIn:",expiresIn);
        const token =jwt.sign(data, this.key,{expiresIn:'1d'})
        return token;
    }

    verify(token: string): string | jwt.JwtPayload | undefined {
        try{
           const decode= jwt.verify(token,this.key);
           console.log("\n+++ jwt.service.ts-21 +++ decode:",decode);
           return decode;
        }
        catch(err){
            console.log("\n+++ jwt.service.ts-25 +++ ERROR:",err);
            return;
        }
    }

    // verify(token){
    //     try{
    //         const decode=jwt.verify(token,this.key,(err)=>{
    //             console.log("\n+++ jwt.service.ts-21 +++ Err:",err);
    //         });
    //         console.log("\n+++ jwt.service.ts-19 +++ decode:",decode);
    //         return decode;
    //     }
    //     catch(err){
    //         console.log("\n+++ jwt.service.ts-25 +++ ERROR:",err);
    //         return;
    //     }
    // }
    
}