export interface SercurityHandle{
    id:string;
    name:string;
    ref:string; //topic reffence
    subHandles:string[];
    pubHandles:string[];
}