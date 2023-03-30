import { DeviceRoute, DeviceStatus } from "./device.interface";
import { getDeviceFromEquipment, getEquipment } from "./device.service";

const deviceRoute:DeviceRoute[]=[
    {
        name:'online',
        ref:'tele/:id/LWT',
        handle:(packet,client,service)=>{
            const str=packet.payload.toString();
            const online=str.toLowerCase()==='online';
            const _client=client||{id:"undknow"}
            service.onConnect(online,_client)
        }
    },
    {
        name:'configure',
       ref:'tasmota/discovery/:id/config',
        handle:(packet,client,service)=>{
            const networkId=(client && client.id)?client.id:"unknown"
            const equipment=getEquipment(packet.payload.toString(),networkId);
            const devices=getDeviceFromEquipment(equipment);
            service.onConfigure(devices,client);
            devices.forEach(dv=>service.getInfor(dv.id,client));
        }
    },
    {
       name:'result',
       ref:'stat/:id/RESULT',//stat/E8DB8494B051/RESULT //tele/:id/STATE
        handle:(packet,client:any,network:any)=>{
            const payload=JSON.parse(packet.payload.toString());
            
            //{"POWER2":"OFF"}
            const stts:DeviceStatus[]=[];
            const eid:string=client.id||""
            Object.keys(payload).forEach(key=>{
                if(!key.startsWith("POWER")) return
                const a=key.substring(key.length-1);
                const id=parseInt(a)||1
                const status=payload[key]=="ON"?1:0
                stts.push({id:eid+"@"+id,status})
            })
            if(stts.length) network.onUpdate(stts,client);
        }
    },
    {
       name:'state',
       ref:'tele/:id/STATE',//tele/E8DB8494B051/STATE tele/E8DB849DBFAE/SENSOR
        handle:(packet,client:any,network:any)=>{
            const payload=JSON.parse(packet.payload.toString())
            const stts:DeviceStatus[]=[];
            const eid:string=client.id||""
            Object.keys(payload).forEach(key=>{
                if(!key.startsWith("POWER")) return
                const a=key.substring(key.length-1);
                const id=parseInt(a)||1
                const status=payload[key]=="ON"?1:0
                stts.push({id:eid+"@"+id,status})
            })
            console.log("\n++++ tasmota.handle.ts-109 ++++",{stts})
            if(stts.length) network.onUpdate(stts,client);
        }
    },
    {   
        //tele/E8DB849DBFAE/RESULT
        // payload:{"ZbState":{"Status":34,"IEEEAddr":"0x00124B0023B46876","ShortAddr":"0x329F","ParentNetwork":"0x0000","JoinStatus":1,"Decision":0}}
        name:'join network',
        ref:'tele/:eid/RESULT',
        handle:(packet,client,service)=>{
            const obj=JSON.parse(packet.payload.toString());
            const ZbState=obj.ZbState;
            if(!ZbState) return;//not correct format
            const status=ZbState.Status;
            if(!status||status!==34) return;
            const fullAddr=ZbState.IEEEAddr;
            const shortAddr=ZbState.ShortAddr;
            console.log("\n+++ config data +++ ",{fullAddr,shortAddr});
            service.onEdit([{id:fullAddr,networkId:shortAddr}],client)
        }
    },
    {
        //tele/E8DB849DBFAE/SENSOR tele/E8DB849DBFAE/SENSOR
        //{"ZbReceived":{"0x329F":{"Device":"0x329F","Humidity":69.45,"Endpoint":1,"LinkQuality":92}}}
        //payload:{"ZbReceived":{"0x329F":{"Device":"0x329F","Temperature":27.89,"Endpoint":1,"LinkQuality":94}}}
        name:"value of sensor",
        ref:'tele/:eid/SENSOR',
        handle:(packet,client,service)=>{
            const obj=JSON.parse(packet.payload.toString());
            const ZbReceived=obj.ZbReceived;
            if(!ZbReceived) return;
            const idvs=Object.keys(ZbReceived).map(key=>{
                const dv=ZbReceived[key];
                const networkId=dv.Device as string;
                return {...dv,networkId}
            }) 
            if(!idvs.length) return;
            console.log("\n+++ device.route.ts-96 ",idvs);
            service.updateByNetworkId(idvs,client)
        }
    }
]

export default deviceRoute;