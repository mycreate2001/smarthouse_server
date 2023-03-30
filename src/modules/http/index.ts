import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import express from 'express'
import { createLog } from "advance-log";
import { join, resolve } from "path";
import createRouter from "./upload";
import LocalDatabaseLite, { DataConnect } from "local-database-lite";
const _PORT=3000
export default function startupExpress(infor:ModulePackage,database:LocalDatabaseLite){
    const log=createLog(infor.id,"center")
    /** verify */
    if(!database) throw new Error("load database error")
    /** execute */
    const db=database.connect("modules") as DataConnect<ModulePackage>;
    const router=createRouter(db);
    const port=infor.params.port?infor.params.port:_PORT
    const app=express();
    app.use(express.static(resolve("publish")));
    app.get("/",(req,res)=>{
        log("new request")
        res.json("it's works!")
    })

    app.get("/packet")

    app.use("/module",router);

    app.listen(port,()=>log("http startup port:",port));
    return app;
}