import { Request, Response, Router } from "express"
import { resolve } from "path";
import multer from 'multer'
import { createReadStream,unlinkSync } from "fs";
import unzipper from 'unzipper'
import { getModuleInfor } from "../../lib/module-loader/module.service";
import { DataConnect } from "local-database-lite";
import { ModulePackage } from "../../lib/module-loader/module.interface";
import { createLog } from "../../lib/log";
const _UPLOAD_PATH=resolve("storage","upload")//require('../../../storage/upload')
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,_UPLOAD_PATH)
    },
    filename(req, file, cb) {
        cb(null,file.originalname)
    },
})
const upload=multer({storage})

export default function createRouter(db:DataConnect<ModulePackage>):Router{
    const router=Router();
    
    router.get("/upload",(req,res)=>{
        res.sendFile(resolve("views","upload.html"))
    })

    router.post("/upload",upload.single('file'),uploadModule)
    router.get("/packages",async (req,res)=>{
        const modules=await db.search();
        res.json(modules)
    })
    function uploadModule(req:Request,res:Response){
        const log=createLog("uploadModule","center")
        try{
            const file=req.file
            if(!file) throw new Error("upload not include file");
            const dir:string=resolve("dist","modules",file.originalname.substring(0,file.originalname.length-4));
            createReadStream(file.path).pipe(unzipper.Extract({path:dir}))
            .promise().then(_=>{
                unlinkSync(file.path);
                const infor=getModuleInfor(dir);
                if(!infor) throw new Error("not get module infor")
                log("new packet\n\t\t",infor)
                return db.add(infor,true)
            })
            .then(_=>{
                log("upload packet success\n\t\t",{file,dir})
                res.json({success:1,message:"upload package is successes!"})
            })
            .catch(err=>{throw err})
        }
        catch(err){
            const msg:string=err instanceof Error?err.message:"other error"
            log("#### ERROR ###\n",err);
            res.json({success:0,message:"upload package is failred!"})
        }
    }
    
    return router
}


