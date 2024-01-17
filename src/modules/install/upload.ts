// import { Request, Response, Router } from "express"
import { resolve } from "path";
import multer from 'multer'
import { createReadStream,unlinkSync } from "fs";
import unzipper from 'unzipper'
import { createDebug, createLog } from "advance-log";
import { getModuleInfor } from 'module-loader/service'


/** constant */
const _UPLOAD_PATH=resolve("storage","upload");
// const debug=createDebug("upload packet",1);
const storage=multer.diskStorage({
    destination:function(req,file,cb){
        cb(null,_UPLOAD_PATH)
    },
    filename(req, file, cb) {
        cb(null,file.originalname)
    },
})
const upload=multer({storage})


/*** main */
export default function createUpload(db:any,Router:any){
    const router=Router();
    router.get("/",(req:any,res:any)=>{
        res.sendFile(resolve("views","upload.html"))
    })

    router.post("/",upload.single('file'),uploadModule(db))
    router.use("*",(req:any,res:any)=>{
        res.json({error:1,msg:"bad request"})
    })
 
    return router
}

  /** handle upload packet.zip */
  function uploadModule(db:any){
    return (req:any,res:any,next:()=>void)=>{
        const log=createLog("uploadModule")
        try{
            const file=req.file
            if(!file) throw new Error("upload not include file");
            // debug(1,"TEST file ",{file})
            const dir:string=resolve("dist","modules",file.originalname.substring(0,file.originalname.length-4));
            createReadStream(file.path).pipe(unzipper.Extract({path:dir}))
            .promise().then(_=>{
                unlinkSync(file.path);
                const infor=getModuleInfor(dir);
                if(!infor) throw new Error("not get module infor")
                log("new packet\t",infor)
                return db.add(infor,true)
            })
            .then(_=>{
                log("upload packet success\n\t\t")
                res.json({success:1,message:"upload package is successes!"})
            })
            .catch(err=>{throw err})
        }
        catch(err){
            // const msg:string=err instanceof Error?err.message:"other error"
            log("#### ERROR ###\n",err);
            res.json({success:0,message:"upload package is failred!"})
        }
    }
}


