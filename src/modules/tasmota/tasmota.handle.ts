/**
 * packet = {
    
 */

import Network from "../network/network";

export interface ObjectPacket{
    payload:any
    retain:boolean;
    topic:string;
    cmd:string;
    qos:0|1|2
}
const handles=[
    /**
    cmd: 'publish',
    retain: false,
    qos: 0,
    dup: false,
    length: 157,
    topic: 'tele/E8DB849DBFAE/RESULT',
    payload: '{"ZbState":{"Status":34,"IEEEAddr":"0x00124B002396E6B4","ShortAddr":"0xAA75","ParentNetwork":"0x0000","JoinStatus":1,"Decision":0}}'
     */
    {
        name:'map device',
        topic:'tele/:id/RESULT',
        type:'',
        handle(packet:ObjectPacket,client:any,server:Network){
            const ZbState=packet.payload.ZbState||null;
            if(!ZbState) return console.log("get ZbState failred")
            if(![30,34].includes(ZbState.Status)) return console.log("status not include 30,34")
            const IEEEAddr=ZbState.IEEEAddr;
            const ShortAddr=ZbState.shortAddr;
            console.log("\n\n+++++++++++++++++++ DEBUG +++++++++++++++++++++\n\tmaping address:%s->%s",ShortAddr,IEEEAddr)
        }
    },
    {
        name:'sensors',
        topic:'tele/:id/SENSOR',
        type:'private',
        handle(packet:ObjectPacket,client:any,server:Network){
            //'{"ZbReceived":{"0xB2A2":{"Device":"0xB2A2","Temperature":28.14,"Humidity":56.33,"Endpoint":1,"LinkQuality":110}}}'
            const obj=packet.payload
            const ZbReceived=obj.ZbReceived||{}
            Object.keys(ZbReceived).forEach(key=>{
                const dv=ZbReceived[key];
                const temp=dv.Temperature;
                const humi=dv.Humidity;
                if(temp||humi){
                    console.log("### [handle/%s] result of %s ####",this.name,dv.Device);
                    if(temp) console.log("Temperature:",temp)
                    if(humi) console.log("Humindity:",humi);
                    return dv;
                }
            })
        }
    },
    {
        name:'config',
        topic:'tasmota/discovery/:id/config',
        handle(packet:ObjectPacket,client:any,server:Network){
            const equipment=getEquipment(packet.payload)
            if(!equipment) return;
            console.log("--- equipment ---\n",equipment);
            const devices=getDevicesFromEquipment(equipment);
            console.log("--- devices ---");
            console.table(devices)
        }
    },
    {
        name:'infor1',
        topic:'tele/:id/INFO1',
        handle(packet:ObjectPacket,client:any,server:Network){
            //{"Info1":{"Module":"Sonoff ZbBridge","Version":"12.2.0(zbbridge)","FallbackTopic":"cmnd/E8DB849DBFAE_fb/","GroupTopic":"cmnd/tasmotas/"}}
            const payload=packet.payload;
            const infor1=payload.Info1;
            console.log("------ INFOR1 ------\n",infor1)
        }
    },
    {
        name:'connect status',
        topic:'tele/:id/LWT',
        handle(packet:ObjectPacket,client:any,server:Network){
            console.log("\n\n\n##### tasmota.nadle.ts-85\npacket:",packet)
            const payload=packet.payload
            const status=payload.toLowerCase()=='online'?true:false;
            console.log("handle/%s: connect=%b",this.name,status)
        }
    },
    // {
    //     name:'display infor',
    //     topic:'#',
    //     handle(packet:ObjectPacket,client:any,server:Network){
    //         packet.payload=packet.payload.toString();
    //         console.log("%s msg from client",this.name,packet)
    //     }
    // }

]

function getEquipment(obj:any):Equipment|undefined{

    const equipment:Equipment={
        id:obj.mac,
        name:obj.dn,
        familyName:obj.fn,
        ip:obj.ip,
        mac:obj.mac,
        states:obj.state,
        model:obj.md,
        topics:obj.tp,
        onlineStr:obj.onln,
        buttons:obj.btn,
        version:obj.sw
    }
    return equipment
}


function getDevicesFromEquipment(equipment:Equipment):Device[]{
    const length=equipment.familyName.filter(n=>n).length;
    const devices:Device[]=[];
    for(let i=0;i<length;i++){  
        const dv:Device={
            id:equipment.id+"@"+i,
            eid:equipment.id,
            name:equipment.familyName[i],
            states:equipment.states,
            model:equipment.model,
            state:equipment.buttons[i]
        }
        devices.push(dv)
    }
    return devices
}

interface Equipment{
    id:string;              //mac
    name:string;            //dn
    familyName:string[];    //fn
    ip:string;              //ip
    mac:string;             //mac
    states:string[];        //state
    model:string;           //md
    topics:string[];        //tp
    onlineStr:string;       //onln,
    buttons:number[];
    version:string;
}

interface Device{
    id:string;
    eid:string;
    name:string;
    states:string[];
    model:string;
    state:number;
}

export default handles;
