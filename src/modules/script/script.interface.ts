export interface ScriptData{
    id:string;
    condition:ScriptCondition[];
    tasks:Task[];
}

const condition:ScriptCondition[]=[
    {id:"123",type:"sensor",min:1,max:2}
]

export type conditionType="device"|"touch"|"sensor"|"time"
export type ScriptCondition=ScriptConditionSensor|ScriptConditionDevice|ScriptConditionTouch|ScriptConditionTime|ScriptConditionTime

export interface ScriptConditionSensor{
    id:string;
    type:'sensor';
    min:number;
    max:number;
}

export interface ScriptConditionDevice{
    id:string
    type:'device',
}

export interface ScriptConditionTouch{
    id:string;
    type:'touch'
    touch:string;
}

export interface ScriptConditionTime{
    id:string;
    type:'time',
    time:string;
}


export interface Task{
    id:string;
    task:Function;
}