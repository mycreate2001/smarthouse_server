import { DataConnect, LocalDatabaseLite, LocalDatabaseQuery } from "local-database-lite";
import { CommonDriverList, CommonDriverService, Device, DeviceBasic, DeviceOpt, DeviceValue, ValuesBasic, _DB_DEVICE, deviceUpdateList } from "../../interface/device.interface";
import { DriverPacket } from "../../interface/driver.interface";
import { CommonClient, CommonNetwork, CommonNetworkPacket } from "../../interface/network.interface";
import { createOption, getList, toArray } from "ultility-tools";
import { createLog } from "advance-log";
import tEvent from "ultility-tools/dist/lib/event";

const _LABEL="device"
const _ONLINE_KEY="online";             // search online for device values
const _DEVICE_EVENT_KEY="device"
const _CHANGE_KEY="change"              // change event label, example device/<deviceid>/CHANGE
const log=createLog(_LABEL,{enablePos:true})

export default class DriverService extends tEvent implements CommonDriverService{
    drivers:DriverPacket[];
    networks:CommonNetworkPacket[];
    deviceDb:DataConnect<Device>;
    nDevices:DeviceBasic[]=[];
    constructor(drivers:DriverPacket[],networks:CommonNetworkPacket[],database:LocalDatabaseLite){
        super();
        // log("### test-001:networks/n",networks.map(network=>network.id));
        log('### test-002: drivers ',drivers);
        this.drivers=drivers;
        this.networks=networks;
        this.deviceDb=database.connect(_DB_DEVICE);
        this._init();
    }
    private _init(){
        const networks=getList(this.networks,"id");
        networks.forEach(id=>{
            const networkPacket=this.networks.find(n=>n.id===id);
            if(!networkPacket) return log("## ERROR-001: intenal error");
            const network=networkPacket.service;
            const drivers=this.drivers.filter(d=>d.networkId===id);
            if(!drivers || !drivers.length) return log("## WARNING-002: no support driver networkId:%d, drivers:",id,drivers);
            // const list=drivers.services.map(driver=>{
            //     network.on(driver.ref,(client:any,packet:any)=>{
            //         driver.handler(client,packet,driver,this,network);
            //     })
            //     return {id:driver.id,name:driver.name,ref:driver.ref}
            // })
            drivers.forEach(driver=>{
                driver.services.forEach(service=>{
                    network.on(service.ref,(client:any,packet:any)=>{
                        service.handler(client,packet,service,this,network)
                    })
                })
            })
        })
    }

    /** connect */
    onConnect(eid: string, online: boolean) {
        this.deviceDb.search({key:'eid',type:'==',value:eid})
        .then(devices=>{
            let isCommit:boolean=false; // commit or not (for localdatabaseLite only)
            const value=online?1:0      //value of online or offline in devicevalues
            devices.forEach(device=>{
                const ndevice:DeviceBasic={id:device.id,values:[{id:_ONLINE_KEY,value}]}
                if(this._updateDevice(device,ndevice)) isCommit=true
            })
            if(isCommit) this.deviceDb.commit();
        })
        
    }

    /** update device from device */
    onUpdate(idvs: DeviceBasic[]) {
        const ids:string[]=idvs.map(idv=>idv.id)
        this.deviceDb.gets(ids)
        .then(devices=>{
            //check in database
            const nDevices:DeviceBasic[]=[];
            let isCommit:boolean=false;
            idvs.forEach(idv=>{
                const device=devices.find(d=>d.id===idv.id);
                if(!device) return nDevices.push(idv);
                if(this._updateDevice(device,idv)) isCommit=true;
            })
            // add new device
            if(nDevices.length) this.addNewDevice(nDevices)
            // commit
            if(isCommit) this.deviceDb.commit();
        })
    }

    /** add new device */
    addNewDevice(idvs:DeviceBasic|DeviceBasic[]){
        toArray(idvs).forEach(idv=>{
            const pos=this.nDevices.findIndex(d=>d.id===idv.id);
            if(pos==-1) this.nDevices.push(idv);
            else Object.assign(this.nDevices[pos],idv);
        })
        log("update new device ",this.nDevices);
    }

    /**
     * 
     * @param oDevice old device
     * @param nDevice new device
     * @param opts 
     * @returns true=need to update, false not update
     */
    private _updateDevice(oDevice:Device,nDevice:DeviceBasic,opts:Partial<UpdateDeviceInput>={}):boolean{
        const _opts=createUpdateDeviceInput(opts);
        let isUpdate:boolean=false;
        //update value
        const nValues=nDevice.values||[];
        const oValues=oDevice.values||[];
        nValues.forEach(nValue=>{
            const oValue=oValues.find(v=>v.id===nValue.id);
            // not yet exist => update
            if(!oValue) {
                const _value:DeviceValue={name:nValue.id,type:'range',range:[],isControl:true,...nValue}
                oValues.push(_value)
                isUpdate=true;
                return;
            }
            //change
            if(oValue.value!==nValue.value){
                const update:DataChange={
                    id:nValue.id,
                    oldValue:oValue.value,
                    newValue:nValue.value
                }
                oValue.value=nValue.value;
                isUpdate=true;
                //emit event
                this.emit(`${_DEVICE_EVENT_KEY}/${nValue.id}/${_CHANGE_KEY}`,update);
                this.emit(`${_DEVICE_EVENT_KEY}/${nValue.id}/${nValue.value}`,update);
                return;
            }
        })

        // update other information
        _opts.updateList.forEach(key=>{
            const nItem=(nDevice as any)[key];
            const oItem=(oDevice as any)[key];
            if(nItem===undefined) return;//not update
            if(nItem!==oItem) {
                (oDevice as any)[key]=nItem;
                isUpdate=true;
            }
        })
        //update
        if(isUpdate) this.deviceDb.add(oDevice,_opts.isCommit);
        return isUpdate?true:false;
    }

    onUpdateBySearch(idv: Partial<Device>, ...queries: LocalDatabaseQuery[]) {
        this.deviceDb.search(...queries)
        .then(devices=>{
            let isCommit:boolean=false;//commit database
            devices.forEach(device=>{
                const ndevice:DeviceBasic={...device,...idv};
                if(this._updateDevice(device,ndevice)) isCommit=true;
            });
            if(isCommit) this.deviceDb.commit();
        })
    }

    remote(device: Device) {
        const remote=this.drivers.find(dv=>dv.type===device.type);
        if(!remote) return log("### ERROR:Not remote service");
        log("### WARING: not handle")
    }
    getServices(): CommonDriverList[] {
        throw new Error("Method not implemented.");
    }
    register(idvs: DeviceOpt[]) {
        throw new Error("Method not implemented.");
    }


    
}


export interface DataChange{
    id:string;
    oldValue:any;
    newValue:any
}

export interface UpdateDeviceInput{
    isCommit:boolean;
    updateList:string[]
}

function createUpdateDeviceInput(opts:Partial<UpdateDeviceInput>={}):UpdateDeviceInput{
    const df:UpdateDeviceInput={
        isCommit:false,
        updateList:deviceUpdateList
    }
    return createOption(df,opts)
}