export default class tEvent{
    _events:EventData={}
    constructor(){}

    on(title:string,callback:Function){
        //checking
        if(!title||!callback) return 0;
        //handle
        const event=this._events[title]
        if(!event) {
            this._events[title]=[callback];
            return 1;//case #1
        }
        if(!event.find(cb=>cb===callback)) {
            event.push(callback);
            return 2;//case #2
        }
        return 0;//No add
    }

    emit(title:string,...data:any[]){
        const events=this._events[title];
        if(!events||!events.length) return;
        events.forEach(cb=>cb(...data))
    }

    /**
     * 
     * @param callback callback need to delete
     * @returns result of delete true/false=already delete/not yet
     */
    delete(callback:Function):boolean{
        return Object.keys(this._events).some(title=>{
            const callbacks=this._events[title];
            if(!callbacks||!callbacks.length) return false;
            const pos=callbacks.findIndex(cb=>cb===callback);
            if(pos==-1) return false;//continue to find others
            callbacks.splice(pos,1);
            return true;
        })
    }

    deleteByTitle(title:string){
        //check
        if(!title) return false;
        const callbacks=this._events[title];
        // if(!callbacks||!callbacks.length) return false;
        delete this._events[title];
        return true;
    }
}

/////
export interface EventData{
    [title:string]:Function[]
}