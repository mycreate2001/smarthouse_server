import { InputModule, ModulePackage } from "../../lib/module-loader/module.interface";
import express from 'express'
import { createLog } from "../../lib/log";
import { join, resolve } from "path";
import createRouter from "./upload";
import LocalDatabaseLite, { DataConnect } from "local-database-lite";
const _PORT=3000
export default function startupExpress(infor:ModulePackage,database:LocalDatabaseLite){
    const log=createLog(infor.id,"center")
    try{
        /** verify */
        if(!database) throw new Error("load database error")
        /** execute */
        const db=database.connect("modules") as DataConnect<ModulePackage>;
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
    catch(err){
        const msg=err instanceof Error?err.message:"other error"
        log("### ERROR:%s",msg);
        return null;
    }
}