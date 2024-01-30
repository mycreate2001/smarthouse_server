import { DataConnect, LocalDatabaseLite, LocalDatabaseQuery } from "local-database-lite";
import { CommonDriverList, CommonDriverService, Device, DeviceBasic, DeviceOpt, DeviceValue, ValuesBasic, _DB_DEVICE, deviceUpdateList, deviceValueDefault } from "../../interface/device.interface";
import { DriverHook, DriverPacket } from "../../interface/device-service.interface";
import { CommonClient, CommonNetwork, CommonNetworkPacket } from "../../interface/network.interface";
import { createOption, getList, toArray } from "ultility-tools";
import { createLog } from "advance-log";
import tEvent from "ultility-tools/dist/lib/event";

const _LABEL="device"
const _ONLINE_KEY="online";             // search online for device values
const _DEVICE_EVENT_KEY="device"
const _CHANGE_KEY="change"              // change event label, example device/<deviceid>/CHANGE
const _DEFAULT_GROUP="default"
const _DEFAULT_TYPE="unknown"
const log=createLog(_LABEL,{enablePos:true})

export default class DeviceService extends tEvent implements CommonDriverService {
    drivers:DriverPacket[];
    networks:CommonNetworkPacket[];
    dbDevice:DataConnect<Device>;
    nDevices:DeviceBasic[]=[];
    constructor(drivers:DriverPacket[],networks:CommonNetworkPacket[],database:LocalDatabaseLite){
        super(true);
        // log("### test-001:networks/n",networks.map(network=>network.id));
        // log('### test-002: drivers ',drivers);
        this.drivers=drivers;
        this.networks=networks;
        this.dbDevice=database.connect(_DB_DEVICE);
        this._init();
    }
    
    getDevices(...queries: LocalDatabaseQuery[]): Promise<Device[]> {
       return this.dbDevice.search(...queries)
    }

    async register(idvs: DeviceBasic | DeviceBasic[]):Promise<string[]> {
        console.log(idvs);
        const _idvs:DeviceBasic[]=toArray(idvs);
        return this.dbDevice.gets(_idvs.map(i=>i.id))
        .then(devices=>{
            const list:string[]=[];
            _idvs.forEach(idv=>{
                const _device=devices.find(d=>d.id===idv.id);
                if(_device) return log("## WARING: already register ",{id:idv.id,name:_device.name});
                list.push(idv.id);
                const device=createDeviceFromBasic(idv);
                this.dbDevice.add(device,false)
            })
            //commit
            if(list.length) this.dbDevice.commit();
            //return
            return list
        })
    }
    

    /** connect */
    onConnect(eid: string, online: boolean) {
        this.dbDevice.search({key:'eid',type:'==',value:eid})
        .then(devices=>{
            let isCommit:boolean=false; // commit or not (for localdatabaseLite only)
            const value=online?1:0      //value of online or offline in devicevalues
            devices.forEach(device=>{
                const ndevice:DeviceBasic={id:device.id,values:[{id:_ONLINE_KEY,value}]}
                if(this._updateDevice(device,ndevice)) isCommit=true
            })
            if(isCommit) this.dbDevice.commit();
        })
        
    }

    /** update device from device */
    onUpdate(idvs: DeviceBasic[],label:string="") {
        label=makeLabel(label,"onUpdate");
        log("%d %s",label,JSON.stringify(idvs))
        const ids:string[]=idvs.map(idv=>idv.id)
        this.dbDevice.gets(ids)
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
            if(nDevices.length) this._addNewDevice(nDevices,label)
            // commit
            if(isCommit) this.dbDevice.commit();
        })
    }

    /** add new device */
    private _addNewDevice(idvs:DeviceBasic|DeviceBasic[],label:string=''){
        label=[label,"_upDevice"].join("/");
        toArray(idvs).forEach(idv=>{
            const pos=this.nDevices.findIndex(d=>d.id===idv.id);
            if(pos==-1) this.nDevices.push(idv);
            else Object.assign(this.nDevices[pos],idv);
        })
        log("%dupdate new device %s",label,JSON.stringify(this.nDevices));
    }

    /**
     * 
     * @param oDevice old device
     * @param nDevice new device
     * @param opts 
     * @returns true=need to update, false not update
     */
    private _updateDevice(oDevice:Device,nDevice:DeviceBasic,opts:Partial<UpdateDeviceInput>={},label:string=""):boolean{
        label=makeLabel(label,"_upDevice");
        log("%d init %s",label,JSON.stringify({oDevice,nDevice}))
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
        if(isUpdate) {
            log("%d update %s",label,JSON.stringify(oDevice))
            this.dbDevice.add(oDevice,_opts.isCommit);
        }
        return isUpdate;
    }

    private _init(){
        const networks=getList(this.networks,"id");
        networks.forEach(id=>{
            const networkPacket=this.networks.find(n=>n.id===id);
            if(!networkPacket) return log("## ERROR-001: intenal error");
            const network=networkPacket.service;
            const drivers=this.drivers.filter(d=>d.networkIds.includes(id));
            if(!drivers || !drivers.length) return log("## WARNING-002: no support driver networkId:%d, drivers:",id,drivers);
            drivers.forEach(driver=>{
                Object.keys(driver.services).forEach(serviceId=>{
                    const service:DriverHook={...driver.services[serviceId],id:serviceId}
                    network.on(service.ref,(client:any,packet:any)=>{
                        service.handler(client,packet,service,this,network)
                    })
                })
            })
        })
    }

    onUpdateBySearch(idv: Partial<Device|DeviceBasic>, search:Partial<DeviceBasic>,label:string='') {
        label=makeLabel(label,"upBySearch");
        log("%d %s",label,JSON.stringify({idv,search}))
        const queries=Object.keys(search).map(key=>{
            const value=(search as any)[key]
            const query:LocalDatabaseQuery={key,type:'==',value}
            return query
        })
        this.dbDevice.search(...queries)
        .then(devices=>{
            let isCommit:boolean=false;//commit database
            devices.forEach(device=>{
                const ndevice:DeviceBasic={...device,...idv};
                if(this._updateDevice(device,ndevice),label) isCommit=true;
            });
            if(isCommit) this.dbDevice.commit();
        })
        
        //new device
        this.nDevices.filter(ndv=>{
            const check=Object.keys(search).every(key=>(search as any)[key]===(ndv as any)[key]);
            if(!check) return;
            //update
            const after=Object.assign({},ndv,idv)
            log("%d update un-register devices %s",label,JSON.stringify({before:ndv,after}))
           ndv=after;
        })
    }

    remote(idvs: DeviceBasic|DeviceBasic[],network:CommonNetwork,label:string='') {
        label=makeLabel(label,"remote");
        const _idvs=toArray(idvs);
        log("%d remote %s",label,JSON.stringify(idvs))
        const ids=_idvs.map(d=>d.id);
        this.dbDevice.gets(ids)
        .then(devices=>{
            _idvs.forEach(idv=>{
                const device=devices.find(d=>d.id===idv.id);
                if(!device) return log("### WARNING: not inside database ",idv);
                const remote=this.drivers.find(dv=>dv.type===device.type);
                if(!remote) return log("### WARING: No method for remote ",{drivers:this.drivers,idv});
                // remote.control.power({...idv,type:device.type},network);
                remote.control.power({...device,idv},network);
            })
        })
    }
    getServices(): CommonDriverList[] {
        throw new Error("Method not implemented.");
    }

    test(msg:string){
        log("test is success, msg:",msg);
    }


    
}

///////////// MINI FUNCTIONS /////////////////
export function createDeviceFromBasic(idv:DeviceBasic):Device{
    const tmp:ValuesBasic[]=idv.values||[];
    const values:DeviceValue[]=[];
    tmp.forEach(val=>{
        const value=deviceValueDefault[val.id];
        if(!value) return log("### WARING: value dont have template ",val);//not find
        value.value=val.value;
        values.push(value)
    })
    const device:Device={
        id: idv.id,
        name: idv.eid || idv.id,
        eid: idv.eid || "",
        type: idv.type || _DEFAULT_TYPE,
        group: idv.group || _DEFAULT_GROUP,
        values,
        model: idv.model || "",
        address: idv.address || "",
        mac: idv.mac || "",
        icon: ""
    }
    return device
}

function makeLabel(...labels:string[]):string{
    return labels.filter(l=>!!l).join("/")
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