import { ModulePackage } from '../../lib/module-loader/module.interface'
import LocalDatabaseLite, { DataConnect } from "local-database-lite";
import { TopicHandle } from './topic.interface';

export default function startTopicDatabase(infor:ModulePackage,db:LocalDatabaseLite){
    if(!db) throw new Error("load database error")
    const topic:DataConnect<TopicHandle>= db.connect("topics");
    return topic;
}