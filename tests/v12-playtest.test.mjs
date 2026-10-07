import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as A from '../public/action-engine.js';
import * as D from '../public/dungeon.js';
import {gatePromptBox} from '../public/combat-view.js';
import {ui} from './ui-harness.mjs';
function journey(){const meta=A.createMeta(),run=A.createRun(meta,'spark',153);run.room='reliquary';run.cleared=['threshold','reliquary'];run.discovered=['threshold','reliquary','forge'];return {version:2,meta,run};}
test('Feather contact is forgiving and still requires a cleared Reliquary',()=>{
 const {run}=journey();run.player.x=675;run.player.y=300;A.stepRun(run);assert.ok(run.relics.includes('ivory-feather'));
 const locked=journey().run;locked.cleared=['threshold'];locked.player.x=620;locked.player.y=300;A.stepRun(locked);assert.ok(!locked.relics.includes('ivory-feather'));
 const entrance=Object.entries(A.ROOMS).flatMap(([id,room])=>Object.entries(room.exits).map(([dir,e])=>({id,dir,e}))).find(g=>g.e.to==='night-door'&&g.e.relics?.includes('ivory-feather'));assert.ok(entrance);run.room=entrance.id;run.cleared.push(run.room,entrance.e.ward);run.abilities=['phase','root','fracture','morph'];run.keys=['ivory','crown','tide','pearl','seed','ember','dusk','orbit'];run.seals=['stratum','tideglass','verdant','cinder'];assert.equal(A.gateStatus(run,entrance.dir).available,true);
});
test('rematch pause is practice copy and a close loss shows exact remaining guardian health',()=>{
 const saved=journey(),view=ui(saved,{entry:true});view.window.SparkDescent.selectProfile('pc');view.window.SparkRematches.start('forge');
 view.run('paused=true;renderOverlay(true)');assert.match(view.el('game-overlay').innerHTML,/Resume this echo/);assert.doesNotMatch(view.el('game-overlay').innerHTML,/saved spark|Let this body go/);
 view.run("run.enemies[0].hp=200;run.player.hp=0;run.phase='dead';renderOverlay(true)");assert.match(view.el('game-overlay').innerHTML,/200 \/ 4000/);assert.match(view.el('game-overlay').innerHTML,/5.0%/);
 view.window.SparkRematches.return();assert.equal(view.run('entryMode'),'descent');assert.equal(view.run('run.room'),'reliquary');
});
test('save and return from floor seven prepares floor eight, preserving build',()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.run("enterDungeon();start('spark');run.dungeon.floor=7;run.dungeon.floorsCleared=7;run.cleared=[run.room];run.phase='resolve';run.xp=0;run.boons.edge=3;returnToStart()");
 assert.match(view.el('entry-dungeon').textContent,/floor 8/);view.run('enterDungeon()');assert.equal(view.run('run.dungeon.floor'),8);assert.equal(view.run('run.boons.edge'),3);assert.ok(view.run('validDungeon(run)'));
});
test('checkpoint and Living vessel recovery retain separate actual amounts',()=>{
 const view=ui(null,{entry:true});view.window.SparkDescent.selectProfile('pc');view.run("enterDungeon();start('spark');run.phase='boon';run.choices=['shell'];run.player.hp=50;run.dungeon.recovered=22;chooseBoon(run,'shell');run.phase='resolve';renderOverlay(true)");
 assert.match(view.el('game-overlay').innerHTML,/checkpoint restored 22 HP/);assert.match(view.el('game-overlay').innerHTML,/Living vessel restored another 35 HP/);
});
test('Nursery, Reliquary and floor seven silhouettes differ and prompts fit their arena',()=>{
 const run=D.createDungeon('spark',153);run.dungeon.floor=7;const spec=D.dungeonFloor(run.seed,7);A.beginDungeonChamber(run,spec.room,spec.pressure);
 assert.equal(new Set([A.obstacles('nursery'),A.obstacles('reliquary'),A.obstacles(run.room,run)].map(JSON.stringify)).size,3);
 for(const arena of [{x:130,y:0,w:640,h:400},{x:0,y:40,w:320,h:470}])for(const dir of ['north','south','east','west']){const b=gatePromptBox(dir,arena,280,76);assert.ok(b.x>=arena.x&&b.y>=arena.y&&b.x+b.w<=arena.x+arena.w&&b.y+b.h<=arena.y+arena.h);}
 const css=fs.readFileSync(new URL('../public/descent.css',import.meta.url),'utf8');assert.doesNotMatch(css,/(?<!>)\.map-key\{position:absolute/);assert.match(css,/\.cantor-portrait\{background-image:url\(enemies-v4.webp\)/);
});
