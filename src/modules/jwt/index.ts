import { JwtService } from "./service";
export default function jwt(infor:any){
    const service=new JwtService();
    return service;
}