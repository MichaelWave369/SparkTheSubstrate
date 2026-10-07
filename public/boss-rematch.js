import {ROOMS,createMeta,createRun,morphRun,beginBossRematch} from './action-engine.js?v=0.17.0';
import {WORLDS,WORLD_GUARDIANS} from './worlds.js?v=0.17.0';
export function rematchBosses(meta,run){const encountered=new Set([...(meta.explored??[]),...(run?.discovered??[])]);return Object.entries(ROOMS).filter(([id,room])=>(room.boss||room.miniboss)&&(encountered.has(id)||(meta.seals??[]).includes(room.seal)||(run?.seals??[]).includes(room.seal))).map(([id,room])=>({id,name:WORLD_GUARDIANS[room.guardian]?.name??(room.guardian==='sentinel'?'The Crown Sentinel':room.miniboss?'The Cantor':'The Warden'),world:room.world}));}
export function createBossRematch(meta,source,room){
 if(!rematchBosses(meta,source).some(b=>b.id===room))throw Error('Encounter that guardian in the campaign first.');
 const rank=WORLDS[ROOMS[room].world].rank,run=createRun(createMeta(),'spark',source?.seed??7919);
 run.abilities=['phase','root','fracture','morph'];if(source?.form&&source.form!=='spark')morphRun(run,source.form);
 run.boons={edge:2+rank*2,cadence:1+rank,orbit:1,shell:2+rank,regeneration:1,magnet:0,dash:1};run.level=6+rank*4;run.nextXp=6+run.level*4;run.player.maxHp+=run.boons.shell*25;
 const health=ROOMS[room].guardian?WORLD_GUARDIANS[ROOMS[room].guardian]?.hp??4000:ROOMS[room].miniboss?4000:4800;
 run.rematch={room,cleared:false,build:'practice',level:run.level,health:health*(rank?1.3+rank*.1:1),damage:1.25};
 beginBossRematch(run,room);run.notice='Guardian echo · Fixed LV '+run.level+' practice build. Your vessel keeps its native weapon; permanent upgrades and campaign equipment stay in your journey. Rematches grant no campaign rewards.';run.noticeTime=12;return run;
}
