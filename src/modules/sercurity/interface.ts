import { NetworkAuthenticate, NetworkAuthorizePublish, NetworkAuthorizeSubscribe } from "../network/network.interface";

export interface Sercurity{
    id:string;
    name:string;
    ref:string; //topic reffence
    subcribe:SercurityData[];
    publish:SercurityData[];
}

export interface SercurityData{
    type:SercurityType;
    value:number|string;
}

export type SercurityType="level"|"login"|"private"

export type SercurityFunc={
    [fn in SercurityType]:Function;
}

export interface SercurityCommon{
    authenticate:NetworkAuthenticate;
    authorizeSubscribe:NetworkAuthorizeSubscribe;
    authorizePublish:NetworkAuthorizePublish;
    setSercurity(sercurities:Sercurity[]):void
}
