import test from 'node:test';
import fs from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {handleRoomRequest} from '../server/rooms.mjs';
import {checkLiveCoop,checkResumedCoop,checkCoopPolish,checkDelayedCoop,checkLethalRevive,checkVoteBehindSnapshot} from './co-op-flow.mjs';

test('live co-op movement reaches both screens through the actual room dialog and frame loop',async()=>{
 const sqlite=new DatabaseSync(':memory:');sqlite.exec(fs.readFileSync(new URL('../drizzle/0000_famous_swarm.sql',import.meta.url),'utf8'));
 const DB={prepare(sql){let values=[];return {bind(...v){values=v;return this;},async first(){return sqlite.prepare(sql).get(...values)??null;},async run(){const result=sqlite.prepare(sql).run(...values);return {meta:{changes:Number(result.changes)}};}};}};
 const fetcher=(path,options)=>handleRoomRequest(new Request('http://local'+path,options),{DB});
 let pair;
 try{pair=await checkLiveCoop(fetcher);await checkCoopPolish(pair);await checkLethalRevive(pair);await checkVoteBehindSnapshot(pair);await checkDelayedCoop(pair);pair=await checkResumedCoop(pair,fetcher);}finally{if(pair){await pair.guest.run('online.leave()');await pair.host.run('online.leave()');}sqlite.close();}
});
