import { createLog } from "advance-log";
const _PORT_DEFAULT=3000
export default function startup(inf:any,express:any){
    /** check */
    if(!express) throw new Error("cannot get 'express'");
    /** execute */
    const log=createLog(inf.id,"center");
    const port=inf.params.port||_PORT_DEFAULT;
    const app=express();
    app.get("/",(req:any,res:any)=>{
        res.json({error:0,msg:"server runing well"})
    })

    app.listen(port,()=>{
        log("start at '%d'",port);
    })
    
    // const router=express.Router();
    // router.get("*",(req:any,res:any)=>{
    //     res.json({msg:"OK nhe"})
    // })
    // app.use("/test",router)
    return {app,Router:express.Router};
}