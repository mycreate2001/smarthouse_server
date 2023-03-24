export interface TopicHandle{
    id:string;
    name:string;
    ref:string; //topic reffence
    handles:string[];
    subHandles:string[];
    pubHandles:string[];
}