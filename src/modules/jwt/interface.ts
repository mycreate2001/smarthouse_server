import { JwtPayload} from 'jsonwebtoken'
export interface JwtServiceCommon{
    sign(data:string|object|Buffer,type:JwtSignFuncType):string
    verify(token:string):JwtPayload|string|undefined;
}

export type JwtSignFunc=(data:string|object|Buffer,type:JwtSignFuncType)=>string
export type JwtVerifyFunc=(token:string)=>JwtPayload|string|undefined

export type JwtSignFuncType="ACCESS"|"REFRESH"