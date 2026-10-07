import {validMeta,validRun} from '../public/action-engine.js';
const json=(value,status=200)=>Response.json(value,{status,headers:{'cache-control':'no-store'}});
const digest=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),byte=>byte.toString(16).padStart(2,'0')).join('');
function validState(state){return !!state&&state.version===2&&validMeta(state.meta)&&(state.run===null||validRun(state.run));}
export async function handleProgressRequest(request,env){
 const database=env.DB;if(!database)return json({error:'Progress saving is temporarily unavailable.'},503);
 const id=new URL(request.url).pathname.slice('/api/progress'.length).replace(/^\//,'');
 if(id&&!/^[a-f0-9-]{36}$/.test(id))return json({error:'Unknown save.'},404);
 try{
  if(!id&&request.method==='POST'){
   const raw=await request.text();if(raw.length>600000)return json({error:'This save is too large.'},413);
   const {state}=JSON.parse(raw);if(!validState(state))return json({error:'Invalid game save.'},400);
   const newId=crypto.randomUUID(),token=crypto.randomUUID()+crypto.randomUUID();
   await database.prepare('INSERT INTO progress (id,token_hash,revision,snapshot,updated) VALUES (?,?,?,?,?)').bind(newId,await digest(token),1,JSON.stringify(state),Date.now()).run();
   return json({id:newId,token,revision:1,state},201);
  }
  if(!id||!['GET','PUT'].includes(request.method))return json({error:'Unknown save action.'},404);
  const token=request.headers.get('authorization')?.replace(/^Bearer /,'');if(!token||token.length>200)return json({error:'Save credential required.'},401);
  const hash=await digest(token),row=await database.prepare('SELECT * FROM progress WHERE id=? AND token_hash=?').bind(id,hash).first();
  if(!row)return json({error:'This save credential is not valid.'},403);
  if(request.method==='GET')return json({revision:row.revision,state:JSON.parse(row.snapshot)});
  const raw=await request.text();if(raw.length>600000)return json({error:'This save is too large.'},413);
  const {revision,state}=JSON.parse(raw);if(!Number.isSafeInteger(revision)||revision<1||!validState(state))return json({error:'Invalid game save.'},400);
  const result=await database.prepare('UPDATE progress SET snapshot=?,revision=revision+1,updated=? WHERE id=? AND token_hash=? AND revision=?').bind(JSON.stringify(state),Date.now(),id,hash,revision).run();
  if(result.meta.changes!==1)return json({error:'Another tab saved this spark. Reload to continue from that save.'},409);
  return json({revision:revision+1});
 }catch{return json({error:'Your save is waiting for a connection.'},503);}
}
