import { createLog } from "./log";

const log=createLog("Event","center");
export default class tEvent{
    _events:EventData={}
    constructor(){}


    /** add event */
    on(title:string,...callbacks:Function[]){
        //1. checking
        // log("on: ### TEST-001 ###",{title,callbacks:callbacks.map(cb=>cb.toString())})
        if(!title||!callbacks.length) return -1; //case #-1: inputing error
        //2. check exist event?
        const events=this._events[title]
        if(!events) {   //2.1 not yet => add new event
            this._events[title]=[{callbacks,isKeep:true}];
            return 1;//case #1 new event
        }

        // 3. check exist callback?
        const event=events.find(ev=>ev.callbacks===callbacks)
        if(!event) {    //3.1 new callback
            events.push({callbacks,isKeep:true});
            return 2; //case #2 add new call back to existing event
        }
        else if(event.isKeep==false){//3.2.1 exits callback but different keep
            event.isKeep=true;
            return 3;   // case #3: update isKeep for existing both event, callback
        }
        return 0;       //No add
    }


    /** add once time event */
    once(title:string,...callbacks:Function[]){
        //checking
        if(!title||!callbacks.length) return 0;
        //handle
        const events=this._events[title]
        if(!events) {
            this._events[title]=[{callbacks,isKeep:false}];
            return 1;//case #1
        }
        const event=events.find(ev=>ev.callbacks===callbacks);
        if(!event) {
            events.push({callbacks,isKeep:false});
            return 2;//case #2
        }
        else if(event.isKeep==true) {
            event.isKeep=false;
            return 3; //case #3
        }
        return 0;//No add
    }

    /**
     * 
     * @param title event
     * @param data params
     * @returns number of function handle
     */
    emit(title:string,...data:any[]):number{
        const events=this._events[title]||[];
        const length=events.length;
        log("emit '%s' handle=",title,length);
        if(!length) return 0;
        // handle callbacks
        events.forEach(event=>{
            const callbacks=event.callbacks;
            runCallback(event.callbacks,0,...data);
        });
        //remove if once (1 times)
        for(let i=events.length-1;i>=0;i--){
            if(!events[i].isKeep) events.splice(i,1)
        }
        return length;
    }

    /**
     * 
     * @param callback callback need to delete
     * @returns result of delete true/false=already delete/not yet
     */
    delete(callbacks:Function[]):boolean{
        return Object.keys(this._events).some(title=>{
            const events=this._events[title];
            if(!events||!events.length) return false;
            const pos=events.findIndex(ev=>ev.callbacks===callbacks);
            if(pos==-1) return false;
            //continue to find others
            events.splice(pos,1);
            return true;
        })
    }

    deleteByTitle(title:string){
        //check
        if(!title) return false;
        delete this._events[title];
        return true;
    }

    showEvent(title:string=""){
        if(title.length) log(title);
        const arrs:any[]=[];
        Object.keys(this._events).forEach(key=>{
            const events=(this._events[key]||[]).forEach(ev=>{
                ev.callbacks.forEach(cb=>{
                    arrs.push({topic:key,callback:cb.toString(),isKeep:ev.isKeep})
                })
            })
        });
        console.log(arrs);
    }
}


//////////////// MINI FUNCTIONS ////////////////////
export function runCallback(callbacks:Function[],pos:number,...data:any[]):void{
    const callback=callbacks[pos];
    if(!callback) return; //stop
    if(typeof callback!=='function'){
        log("### ERROR ###\n\t\t\t callback is not function",{pos,data,callback});
        return;
    }
    callback(...data,
        (...data1:any[])=>{
            runCallback(callbacks,pos+1,...data1)
        }
    )
}

/////
export interface EventData{
    [title:string]:{
        callbacks:Function[],
        isKeep:boolean;
    }[]
}