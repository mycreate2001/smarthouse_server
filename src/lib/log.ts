/** import */

/** default */
const _COLORS={
    Reset:"\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",
    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    FgGray: "\x1b[90m",
    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgGray: "\x1b[100m"
}//color defined

const codes=[
    // {key:'#yl',color:_COLORS.FgYellow},
    // {key:'#gr',color:_COLORS.FgGreen},
    // {key:'#rd',color:_COLORS.FgRed},
    // {key:'#bl',color:_COLORS.FgBlue},
    // {key:'#rst',color:_COLORS.Reset},
    {key:'%s',color:_COLORS.FgGreen,replace:'%s'},
    {key:'%d',color:_COLORS.FgYellow,replace:'%s'},
    {key:'%b',color:_COLORS.FgBlue,replace:'%s'}
]
const _MAKE_LABEL_LENGTH=15;
const _MAKE_LABEL_LENGTH_MAX=100;
const _MAKE_LABEL_LENGTH_MIN=1;
const _MAKE_LABEL_TEXTURE=" "


/** start log */
export function createLog(label:string,align:'center'|'right'|'left'='right',debug:boolean=true){
    label=`${_COLORS['BgGreen']}${makeLabel(label,{align})}${_COLORS['Reset']}`
    return function log(msg:string|number|object,...args:any[]){
        if(!debug) return;
        let _msg:string=`${timeStamp()} ${label} ${typeof msg=='object'?JSON.stringify(msg):msg}`;
        codes.forEach(code=>{
            const replace=code.replace?
                code.color+code.replace+_COLORS.Reset:code.color
            _msg=_msg.replace(new RegExp(code.key,'g'),replace)
        });
        console.log(_msg,...args);
    }
}

export function createDebug(label:string,_debug:boolean){
    return function debug(msg:any,...data:any[]){
        if(!_debug) return;
        if(typeof msg=='string') return console.log("["+label+"] "+msg,...data)
        console.log("[%s] ",label,msg,...data)
    }
}

/////////////// PRIVATE FUNCTIONS ////////////////////////////////

/** make label string */
function makeLabel(str:string|number,opts?:Partial<makeStringOptions>){

    //check & handle input
    const _df:makeStringOptions={length:_MAKE_LABEL_LENGTH,texture:_MAKE_LABEL_TEXTURE,align:'right'}
    const _opts=Object.assign(_df,opts);
    str=str+"";
    if(!_opts.texture) _opts.texture=_MAKE_LABEL_TEXTURE;
    _opts.texture=_opts.texture[0];
    if(_opts.length>_MAKE_LABEL_LENGTH_MAX) _opts.length=_MAKE_LABEL_LENGTH_MAX;
    else if(_opts.length<_MAKE_LABEL_LENGTH_MIN) _opts.length=_MAKE_LABEL_LENGTH_MIN
    _opts.texture=makeTexture(_opts.texture,_opts.length)
    //execute
    const _length=str.length;
    switch (_opts.align){
        case 'center':{
            str=_opts.texture+str+_opts.texture;
            const pos=Math.floor((str.length-_opts.length)/2);
            return str.substring(pos,pos+_opts.length);

        }break;

        case 'left':{
            str+=_opts.texture;
            return str.substring(0,_opts.length);
        }break;

        case 'right':{
            str=_opts.texture+str;
            const pos=str.length-_opts.length;
            return str.substring(pos);
        }break;
    }
}

/** make texture string */
function makeTexture(str:string,length:number):string{
    if(str=="") str=_MAKE_LABEL_TEXTURE;
    let out=""
    for(let i=0;i<length;i++){
        out+=str[0];
    }
    return out;
}

/** make timestamp */
function timeStamp(template:string='YYYY.MMM.DD hh:mm:ss.ttt'){
    const now=new Date();
    const time:string[]=[];
    const months="Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(",")
    //year
    time.push(makeLabel(now.getFullYear(),{length:4,align:'right',texture:'0'}));
    time.push(makeLabel(now.getFullYear(),{length:2,align:'right',texture:'0'}));
    //month
    time.push(months[now.getMonth()]);
    time.push(makeLabel(now.getMonth()+1,{length:2,align:'right',texture:'0'}));
    //others
    time.push(makeLabel(now.getDate(),{length:2,align:'right',texture:'0'}));
    time.push(makeLabel(now.getHours(),{length:2,align:'right',texture:'0'}));
    time.push(makeLabel(now.getMinutes(),{length:2,align:'right',texture:'0'}));
    time.push(makeLabel(now.getSeconds(),{length:2,align:'right',texture:'0'}));
    time.push(makeLabel(now.getMilliseconds(),{length:3,align:'right',texture:'0'}));
    time.push(makeLabel(now.getMilliseconds(),{length:2,align:'left',texture:'0'}));
    const list=[
        {key:'YYYY',value:time[0]},
        {key:'YY',value:time[1]},
        {key:'MMM',value:time[2]},
        {key:'MM',value:time[3]},
        {key:'DD',value:time[4]},
        {key:'hh',value:time[5]},
        {key:'mm',value:time[6]},
        {key:'ss',value:time[7]},
        {key:'ttt',value:time[8]},
        {key:'tt',value:time[9]},
    ];
    // console.log("[timestamp] test-001",{list})
    list.forEach(l=>template=template.replace(new RegExp(l.key,'g'),l.value));
    return template;
}


/////////// INTERFACE ///////////////////////////////////////////

interface makeStringOptions{
    length:number;
    texture:string;
    align:'right'|'center'|'left'
}

