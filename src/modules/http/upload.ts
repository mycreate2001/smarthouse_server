import { Router } from "express"
import { join } from "path";
import multer from 'multer'
const _UPLOAD_PATH=join(__dirname,"..","..","..","storage","upload")//require('../../../storage/upload')
const upload=multer({dest:_UPLOAD_PATH})
const router=Router();

router.get("/",(req,res)=>{
    res.sendFile(join(__dirname,"..","..","..","views","upload.html"))
})

router.post("/",upload.single('file'),(req,res)=>{
    res.json({success:1,msg:"upload file success"})
    console.log("upload file sussess!",{file:req.file,body:req.body})
})


export default router;