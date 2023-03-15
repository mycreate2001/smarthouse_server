export function wildcard(topic:string,ref:string):boolean{
    const aTopic:string[]=topic.split("/");
    const aRef:string[]=ref.split("/");
    //check length
    if(aRef.length>aTopic.length) {
        return false;
    }
    if(aRef.length<aTopic.length && aRef[aRef.length-1]!=="#") {
        return false;
    }
    //check content
    let _tp:string=''

    return aRef.every((_ref,i)=>{
        _tp=aTopic[i];
        if(["#","+"].includes(_ref)) return true;
        if(_ref.startsWith(":")) return true;
        if(_ref!==_tp) {
            return false;
        }
        return true;
    })
}

export function getParams<T>(topic:string,ref:string):T{
    const out:any={};
    const aTopic=topic.split("/");
    const aRef=ref.split("/");
    aRef.forEach((ref,i)=>{
        if(!ref.startsWith(":")) return;
        const key=ref.substring(1);
        out[key]=aTopic[i]
    })
    return out as T
}

// const refs=[
//     "abc/#",
//     "abc/+/xyz/#",
//     "abc/123/xxx/aaa",
//     "abc/+/+/aaa",
//     "abc/:id/:label/aaa"
// ]
// const topics=[
//     "abc/123/xyz/aaa",
//     "abd/123/xyz/aaa",
//     "abc/124/xyz/aaa",
//     "abc/123/xya/aaa",
//     "abc/123/xyz/aab",
//     "abb/124/xyz/aaa",
//     "abc/124/xya/aaa",
//     "abc/123/xya/aab",
//     "abb/123/xyz/aab",
//     "abb/124/xya/aaa",
//     "abc/124/xya/aab",
//     "abb/124/xya/aab",
//     "abc/123/xyz/aaa/123"
// ]

// const results:any[]=[]
// refs.forEach(ref=>{
//     topics.forEach(topic=>{
//         results.push({ref,topic,result:wildcard(topic,ref)})
//     })
// })

// console.log("\n--------- result1 -------------");
// console.table(results)
