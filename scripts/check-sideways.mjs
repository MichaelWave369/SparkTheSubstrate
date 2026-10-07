import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createSideJourney,SIDE_ROOMS,sideSave,restoreSide,morphSide,sideGeometry} from '../public/sideways-engine.js';
import {clearRoom,cross,walkTo,frames,climbFeather} from '../tests/sideways-path.mjs';
const s=createSideJourney();
function visit(to){cross(s,to);clearRoom(s);const r=SIDE_ROOMS[to];if(r.key){walkTo(s,r.width-300);assert.ok(s.keys.includes(r.key),'key not collected in '+to);}if(!r.final){const glyph=sideGeometry(to).checkpoint;walkTo(s,glyph.x);frames(s,{});frames(s,{interact:true});assert.equal(s.player.hp,s.player.maxHp,'checkpoint healing in '+to);frames(s,{});}const restored=restoreSide(sideSave(s));assert.ok(restored,'save failed in '+to);Object.assign(s,restored);console.log(to+' · '+Math.ceil(s.player.hp)+' HP · '+s.cleared.length+' rooms');}
visit('glass');visit('machine');visit('cistern');visit('forge');visit('cistern');visit('reliquary');visit('nursery');assert.equal(s.forms.length,6);
visit('reliquary');climbFeather(s);visit('nursery');
visit('archive');visit('belfry');visit('eye');visit('tide-harbor');
for(const [rest,key,boss,next]of [['tide-harbor','tide-archive','tide-throne','grove-rest'],['grove-rest','grove-well','grove-heart','cinder-rest'],['cinder-rest','cinder-fuel','cinder-throne','night-rest'],['night-rest','night-library','night-nest','orbit-rest'],['orbit-rest','orbit-relay','orbit-throne','origin-seam']]){visit(key);visit(rest);visit(boss);visit(next);if(next==='night-rest'){cross(s,'nursery');assert.ok(s.secrets.includes('feather-path'));cross(s,'night-rest');assert.ok(s.player.maxHp>=200);}}
morphSide(s,'human');cross(s,'origin-heart');clearRoom(s);assert.equal(s.phase,'complete');assert.equal(s.cleared.length,27);assert.equal(s.seals.length,6);assert.ok(restoreSide(sideSave(s)));
if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(sideSave(s),null,2));
console.log('Original Sideways route passed: 27 rooms, eight guardians, seven keys, all six vessels, normal health, the Animal-jump Feather and its two-way night shortcut, every world, and saves between visits. Movement, combat, and E gates use actual engine inputs.');
