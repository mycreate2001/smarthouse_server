import createUpload from "./upload";

export default function startup(inf:any,database:any,http:any){
    if(!database) throw new Error("cannot get 'database'");
    if(!http) throw new Error("cannot get 'http'");
    const db=database.connect("modules");
    const {app,Router}=http;
    // app.get("/test",(req:any,res:any)=>res.json({msg:'ok'}))
    app.use("/install",createUpload(db,Router))
}