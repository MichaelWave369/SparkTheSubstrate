import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readCatalog,inspectCatalog,detectEngine,selectSkills,routeTask,validateCatalog} from '../scripts/route-game-skills.mjs';

const chosen=(task,c)=>selectSkills(task,c).map(s=>s.id);
test('native Spark fingerprint and complete offline catalog',async()=>{
 const c=await readCatalog();
 assert.deepEqual(inspectCatalog(c),[]);
 assert.equal(await detectEngine(c),'spark-native-webgl-webxr');
 assert.deepEqual(await validateCatalog(),{
  ok:true,engine:'spark-native-webgl-webxr',skills:7,vendorFiles:18,errors:[]
 });
});
test('deterministic routing and explicit FPS ambiguity protection',async()=>{
 const c=await readCatalog();
 assert.deepEqual(chosen('Quest wrist controller recovery',c),['spark-router','spark-quest-input']);
 assert.deepEqual(chosen('Seven world environment art direction and assets',c),['spark-router','spark-world-art','create-game-assets']);
 assert.deepEqual(chosen('Enemy AI pathfinding',c),['spark-router','game-ai']);
 assert.deepEqual(chosen('Canonical save gates and boss rewards',c),['spark-router','spark-progression']);
 assert.deepEqual(chosen('Profile low FPS and draw calls',c),['spark-router','performance-optimization']);
 assert.deepEqual(chosen('FPS shooter weapon recoil',c),['spark-router']);
 assert.deepEqual(chosen('Update documentation',c),['spark-router']);
});
test('load on demand is offline, finite and scoped',async()=>{
 const o=await routeTask('Quest controller comfort',{load:true});
 assert.deepEqual(o.skills.map(s=>s.id),['spark-router','spark-quest-input']);
 assert.equal(o.contents.length,2);
 assert(o.contents.every(s=>s.content.startsWith('---\n')));
});
test('unsafe paths, duplicated IDs and invalid triggers fail validation',async()=>{
 const c=await readCatalog(),clone=()=>structuredClone(c);
 let x=clone();x.skills[1].file='../../secrets';
 assert(inspectCatalog(x).some(t=>t.includes('Unsafe')));
 x=clone();x.skills[1].id='spark-router';
 assert(inspectCatalog(x).some(t=>t.includes('Duplicate')));
 x=clone();x.vendorFiles.push('../escape');
 assert(inspectCatalog(x).some(t=>t.includes('Unsafe')));
 x=clone();x.project.requiredFiles.push('../../escape');
 assert(inspectCatalog(x).some(t=>t.includes('fingerprint')));
 x=clone();x.skills[2].keywords=[null];
 assert(inspectCatalog(x).some(t=>t.includes('Invalid triggers')));
 assert.throws(()=>chosen('',c),/nonempty task/);
});
test('foreign project fails closed',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'spark-skills-'));
 try{
  const catalog=await readCatalog();
  await mkdir(join(dir,'.agents'),{recursive:true});
  await writeFile(join(dir,'.agents/game-skills.json'),JSON.stringify(catalog));
  await writeFile(join(dir,'package.json'),'{"name":"unrelated"}');
  assert.equal(await detectEngine(catalog,dir),'unknown');
  await assert.rejects(routeTask('Quest controls',{root:dir}),/Unknown Spark fingerprint/);
 } finally{await rm(dir,{recursive:true,force:true});}
});
