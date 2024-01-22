import { createLog } from "advance-log";
import { CommonDriverList, CommonDriverService, Device, DeviceBasic, DeviceOpt, _DB_DEVICE } from "../../interface/device.interface";
import DriverService from "../driver/service";
import { DataConnect, LocalDatabaseLite, LocalDatabaseQuery } from "local-database-lite";
import tEvent from "ultility-tools/dist/lib/event";
import { toArray } from "ultility-tools";

const _LABEL="device"       // module label
const _ONLINE="online"      // online id
const _DEVICE_EVENT="device"
const _UPDATE_LIST="address".split(",")        // list of item can update to device
const log=createLog(_LABEL,{enablePos:true})
export interface DeviceServiceData extends CommonDriverService{
    addDevice(idvs:Device|Device[]):any
    getDevices():Promise<Device[]>
}

/** main */
export default class DeviceService extends tEvent implements DeviceServiceData{
    drivers:DriverService[]=[]
    db:DataConnect<Device>
    newDevices:DeviceBasic[]=[];
    constructor(drivers:DriverService[],db:LocalDatabaseLite){
        super();
        this.db=db.connect(_DB_DEVICE);
        this.drivers=drivers;
        this.drivers.forEach(driver=>{
            driver.onConnect=this.onConnect.bind(this);
            driver.onUpdate=this.onUpdate.bind(this);
            driver.onUpdateBySearch=this.onUpdateBySearch.bind(this);
        });
    }

    getDevices(): Promise<Device[]> {
        return this.db.search();
    }

    /** add device from API */
    addDevice(idvs: Device | Device[]): any {
        const list=toArray(idvs).map(idv=>{
            this.db.add(idv,false);
            return idv.id
        })
        if(list.length) this.db.commit();
    }

    onUpdateBySearch(idv: Partial<Device>, ...queries: LocalDatabaseQuery[]){
        this.db.search(...queries).then(devices=>{
            Object.keys(idv).forEach(key=>{
                devices.forEach(device=>{
                    (device as any)[key]=(idv as any)[key]
                    this.db.add(device,false)
                })
            })
        })
        this.db.commit();
    }

    register(idvs: DeviceOpt[]){

    } 

    remote(device: Device): void {
         this.drivers.map(driver=>driver.remote(device))
    }
    private _addnDevice(idvs:DeviceBasic|DeviceBasic[]){
        toArray(idvs).forEach(idv=>{
            const pos=this.newDevices.findIndex(d=>d.id===idv.id);
            if(pos===-1) return this.newDevices.push(idv); // branch new
            Object.assign(this.newDevices[pos],idv);       // update information
        })
        log("new device update ",this.newDevices);
    }

    /** update information */
    onUpdate(idvs: DeviceBasic[]): void {
        log("update ",{idvs})
        let isCommit:boolean=false;     // enable commit database
        this.db.gets(idvs.map(d=>d.id))
        .then(devices=>{
            idvs.forEach(idv=>{
                let isUpdate:boolean=false;
                const device=devices.find(d=>d.id===idv.id);
                if(!device) return this._addnDevice(idv); // new device
                
                //update for values
                if(idv.values && idv.values.length)
                idv.values.forEach(_new=>{
                    const _old=device.values.find(v=>v.id===_new.id);
                    //default new value
                    if(!_old) {
                        device.values.push({id:_new.id,value:_new.value,type:'range',isControl:true,range:[0,1],name:_new.id})
                        const change:ChangeData={id:_new.id,oldVal:undefined,newVal:_new.value}
                        this.emit(`${_DEVICE_EVENT}/${_new.id}/change`,change);
                        this.emit(`${_DEVICE_EVENT}/${_new.id}/${_new.value}`,change);
                        isUpdate=true;
                    }
                    else if(_old.value!==_new.value) {
                        const change={id:_old.id,oldVal:_old.value,newVal:_new.value}
                        _old.value=_new.value;
                        this.emit(`${_DEVICE_EVENT}/${_new.id}/change`,change);
                        this.emit(`${_DEVICE_EVENT}/${_new.id}/${_new.value}`,change);
                        isUpdate;
                    }
                })

                // update other infor
                Object.keys(idv).forEach(key=>{
                    if(!_UPDATE_LIST.includes(key)) return;//not update
                    (device as any)[key]=(idv as any)[key];
                    isUpdate=true;
                })

                // result
                if(isUpdate) {
                    this.db.add(device,false);
                    isCommit=true
                }
            })

            if(isCommit) this.db.commit();
        })
    }


    getServices(): CommonDriverList[] {
        return this.drivers.reduce((acc:CommonDriverList[],cur)=>{
            const _cur=cur.getServices();
            return [...acc,..._cur]
        },[])
    }

    /** handle device connect */
    async onConnect(eid:string,online:boolean){
        const devices=await this.db.search({key:'eid',type:'==',value:eid})
        devices.forEach(device=>{
            const values=device.values||[];
            const ol=values.find(v=>v.id===_ONLINE);
            const value=online?1:0;     // value 0= offline, 1=online
            if(!ol) values.push({id:_ONLINE,name:_ONLINE,type:'list',value,listNames:['offline','online'],isControl:false})
            else {
                if(ol.value!==value) {
                    const change={id:_ONLINE,oldVal:ol.value,newVal:value}
                    // emit event device/<id>/<item>/change
                    this.emit(`${_DEVICE_EVENT}/${device.id}/${_ONLINE}/change`,change);
                    // emit event device/<id>/<item>/<new Value >
                    this.emit(`${_DEVICE_EVENT}/${device.id}/${_ONLINE}/${value}`,change);
                    ol.value=value;
                }
            }
            this.db.add({...device,values},false)
        })
        if(devices.length) this.db.commit();
        log("connect %d %s =>%d",eid,online?"online":"offline",devices.length);
    }
}

interface ChangeData{
    id:string;
    oldVal:any;
    newVal:any;
}
