import loadAllModule from "./handle_module";
import { ModuleInfor, ModulePackage } from "./interface";
console.clear();
console.log("\n\n\n-----------------------")
const list:ModuleInfor[]=[
    {
        id:'socket_handle',
        name:'socket handle',
        path:'./modules/socket_handle',
        params:{},
        parentId:'websocket',
        type:'handle'
    },
    // {
    //     id:'network',
    //     name:'network',
    //     path:'./modules/network',
    //     params:{},
    //     parentId:'',
    //     type:'main'
    // },
    {
        id:'mqtt',
        name:'mqtt',
        path:'./modules/mqtt',
        params:{port:1886},
        parentId:'network',
        type:'input'
    },
    {
        id:'websocket',
        name:'websocket',
        path:'./modules/websocket',
        params:{port:8888},
        parentId:'network',
        type:'input'
    },
    {
        id:'sercurity',
        name:'sercurity service',
        path:'./modules/sercurity',
        params:{},
        parentId:['mqtt','socket_handle'],
        // parentId:'network',
        type:'handle'
    },
    {
        id:'database',
        name:'database',
        path:'./modules/database',
        params:{},
        // parentId:['mqtt','socket_handle'],
        parentId:'',
        type:'main'
    },
]


const modules=loadAllModule(list);
