import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import express from 'express'
import { createLog } from "../../lib/log";
import { join } from "path";
import router from "./upload";
const _PORT=3000
export default function startupExpress(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center")
    const port=infor.params.port?infor.params.port:_PORT
    const app=express();
    app.use(express.static(join(__dirname,"..","..","..","publish")));//require('../../../views')
    app.get("/",(req,res)=>{
        log("new request")
        res.json("it's works!")
    })

    app.use("/upload",router);

    app.listen(port,()=>log("http startup port:",port));
    log("load success")
    return app;
}