import { ModulePackage } from "../../lib/module-loader/module.interface";
import app from './app.service'
export default function startupApp(infor:ModulePackage){
    console.log("\n+++ app.index.ts-4 +++ app:",app);
    return app;
}