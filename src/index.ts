import { join } from "path";
import { ModuleLoader } from "./lib/module";
console.clear();
console.log("\n\n\n-----------------------")
const db={
    "modules": {
        "socket_handle": {
            "name": "socket handle",
            "path": "../../modules/socket_handle",
            "params": {},
            "targets": ["websocket"],
            "type": "handle"
        },
        "mqtt": {
            "name": "mqtt",
            "path": "../../modules/mqtt",
            "params": {
                "port": 1883
            },
            "targets": ["network"],
            "type": "input"
        },
        "websocket": {
            "name": "websocket",
            "path": "../../modules/websocket",
            "params": {
                "port": 8889
            },
            "targets": ["network"],
            "type": "input"
        },
        "sercurity": {
            "name": "sercurity service",
            "path": "../../modules/sercurity",
            "params": {},
            "targets": [
                "mqtt",
                "socket_handle"
            ],
            "type": "handle"
        },
        "database": {
            "name": "database",
            "path": "../../modules/database",
            "params": {},
            "targets": ["user_database"],
            "type": "main"
        },
        "user_database": {
            "name": "User database",
            "path": "../../modules/database",
            "params": {},
            "targets": ["sercurity"],
            "type": "input"
        },
        "tasmota": {
            "name": "tasmota",
            "path": "../../modules/tasmota",
            "params": {},
            "targets": ["mqtt"],
            "type": "handle"
        }
    }
}

const path=join(__dirname,"storage","database.json");
const lModule=new ModuleLoader(path);
const control:any={}
lModule.startup();