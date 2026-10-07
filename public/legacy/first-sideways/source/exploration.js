import {WORLD_KEYS} from './worlds.js?v=0.13.0';
export const KEYS={
 ivory:{name:'Ivory Key',room:'reliquary',place:'Nacre’s Reliquary',sprite:0,color:'#ecddba',glyph:'♙'},
 tide:{name:'Tide Key',room:'observatory',place:'Drowned Observatory',sprite:1,color:'#99d8e8',glyph:'☽'},
 crown:{name:'Crown Key',room:'belfry',place:'Obsidian Belfry',sprite:2,color:'#e8bd74',glyph:'K'},
 ...WORLD_KEYS
};
export const keyPosition={x:480,y:215};
export const doorId=(from,to)=>[from,to].sort().join(':');
export const validKeys=keys=>Array.isArray(keys)&&keys.length<=Object.keys(KEYS).length&&new Set(keys).size===keys.length&&keys.every(id=>Object.hasOwn(KEYS,id));
