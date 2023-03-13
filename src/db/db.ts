import Database from 'local-database'
import {join} from 'path'
export default new Database(join(__dirname,"..",'..'));
