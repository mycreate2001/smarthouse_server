import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import express from 'express'
import { createLog } from "../../lib/log";
import { join, resolve } from "path";
import createRouter from "./upload";
import { DataConnect } from "local-database-lite";
const _PORT=3000
export default function startupExpress(infor:ModulePackage,modules:InputModule){
    const log=createLog(infor.id,"center")
    //input & checking
    const DbModules=modules.database;
    if(!DbModules||!DbModules.length||!DbModules[0].module){
        log("### ERROR[1]: Load database error")
        return null;
    }
    const db=DbModules[0].module.connect("modules") as DataConnect<ModulePackage>;
    const router=createRouter(db);
    const port=infor.params.port?infor.params.port:_PORT
    const app=express();
    app.use(express.static(resolve("publish")));//require('../../../views')
    app.get("/",(req,res)=>{
        log("new request")
        res.json("it's works!")
    })

    app.get("/packet")

    app.use("/module",router);

    app.listen(port,()=>log("http startup port:",port));
    log("load success")
    return app;
}