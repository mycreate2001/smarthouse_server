import { join } from "path";
import { ModuleLoader } from "./lib/module-loader";
import { ModuleInfor } from "./lib/module-loader/module.interface";
console.clear();
console.log("\n\n\n\n+++++++++++++++++++++++++++++++++++\ntime:%s\n------------------------------------------------------------------\n",Date.now())
// const db={
//     socket_handle: {
//         name: "socket handle",
//         path: "../../modules/socket_handle",
//         params: {},
//         imports: {network:"network/websocket"},
//         keys:"network/socket",
//         level:1
//     },
//     mqtt: {
//         name: "mqtt",
//         path: "../../modules/mqtt",
//         params: {
//             port: 1883
//         },
//         imports: {},
//         keys:"network/mqtt",
//         level:0
//     },
//     network: {
//         name: "network",
//         path: "../../modules/network",
//         params: {},
//         imports:{
//             network:"network/#"
//         },
//         keys:"network",
//         level:10
//     },
//     websocket: {
//         name: "websocket",
//         path: "../../modules/websocket",
//         params: {
//             port: 8888
//         },
//         imports:{},
//         keys:"network/websocket",
//         level:0
//     },
//     sercurity: {
//         name: "sercurity service",
//         path: "../../modules/sercurity",
//         params: {},
//         imports: {
//             network:"network/#",
//             database:"database/user_database"
//         },
//         keys:"network/#",
//         level:11
        
//     },
//     database: {
//         name: "database",
//         path: "../../modules/database",
//         params: {},
//         imports:{},
//         keys:"database/general",
//         level:0
//     },
//     user_database: {
//         name: "User database",
//         path: "../../modules/database/user.database.js",
//         params: {},
//         imports: {database:"database/general"},
//         keys:"database/user_database",

//     },
//     tasmota: {
//         name: "tasmota",
//         path: "../../modules/tasmota",
//         params: {},
//         imports:{database:"database/tasmota_database"},
//         keys:"service/tasmpta",
//         level:12
//     }
// }

const path=join(__dirname,"storage","database.json");
const lModule=new ModuleLoader(path);
const control:any={}
lModule.startup();