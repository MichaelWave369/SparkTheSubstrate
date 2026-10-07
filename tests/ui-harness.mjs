import * as CoopInput from '../public/coop-input.js';
import * as Table from '../public/table-engine.js';
import * as Keepsakes from '../public/substrate-rewards.js';
import * as Expansion from '../public/world-expansion.js';
import * as Rematches from '../public/boss-rematch.js';
import fs from 'node:fs';
import vm from 'node:vm';
import * as A from '../public/action-engine.js';
import * as Worlds from '../public/worlds.js';
import * as Mastery from '../public/mastery.js';
import * as Records from '../public/run-record.js';
import * as Settings from '../public/settings.js';
import * as Entry from '../public/entry.js';
import * as CombatView from '../public/combat-view.js';
import * as Dungeon from '../public/dungeon.js';
import {DuelScreen} from '../public/duel-view.js';
import {SideScreen} from '../public/sideways-view.js';
import {saveRunCard} from '../public/share-run.js';
import {KEYS,doorId} from '../public/exploration.js';
import * as Gear from '../public/equipment.js';
import {ProgressSave} from '../public/progress.js';
import {OnlineRoom} from '../public/online.js';
import * as Coop from '../public/coop-state.js';
import {CHAMBER_STORIES,ENEMY_LORE} from '../public/story.js';
import {FORMS,validateSave} from '../public/engine.js';

export function ui(saved=null,{entry=false,preferences=null,keepsakes=null,table=null,dungeon=null,dom=true,roomOptions=null,deferredClose=false,nativeFocusAfterClose=false,session=null,now=null,deviceStorage=null,wallNow=null}={}){
 const els=new Map(),listeners=new Map(),storage=deviceStorage??new Map(),focuses=[],scrolls=[],drawn=[],closes=[],frames=[],sessionValues=new Map();
 const sessionStorage={getItem:k=>sessionValues.get(k)??null,setItem:(k,v)=>sessionValues.set(k,v),removeItem:k=>sessionValues.delete(k)};
 if(session)sessionStorage.setItem('spark-online-room-v1',JSON.stringify(session));
 class Room extends OnlineRoom{constructor(update,error,options){super(update,error,{...options,...roomOptions,storage:sessionStorage});}start(){this.stop();}pump(){}}
 const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8'),parents=new Map();
 // The strict mode keeps the actual HTML ID tree. Replacing textContent removes
 // descendant elements, and getElementById cannot silently recreate them.
 function removeChildren(id){for(const [child,parent] of [...parents])if(parent===id){removeChildren(child);els.delete(child);parents.delete(child);}}
 function markup(source,parent=null){
  const stack=[{tag:'',id:parent}],voids=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  for(const token of source.matchAll(/<\/?([a-z][\w:-]*)\b([^>]*)>/gi)){
   const tag=token[1].toLowerCase();if(token[0].startsWith('</')){const at=stack.findLastIndex(node=>node.tag===tag);if(at>0)stack.length=at;continue;}
   const attributes=token[2],id=attributes.match(/\bid="([^"]+)"/)?.[1],ancestor=stack.at(-1).id;
   if(id){const node=el(id);parents.set(id,ancestor);node.hidden=/\bhidden(?:\s|$|=)/.test(attributes);node.disabled=/\bdisabled(?:\s|$|=)/.test(attributes);node.value=attributes.match(/\bvalue="([^"]*)"/)?.[1]??node.value;}
   if(!voids.has(tag)&&!token[0].endsWith('/>'))stack.push({tag,id:id??ancestor});
  }
 }
 if(keepsakes)storage.set(Keepsakes.SUBSTRATE_KEY,JSON.stringify(keepsakes));if(table)storage.set(Table.TABLE_KEY,JSON.stringify(table));if(dungeon)storage.set(Dungeon.DUNGEON_KEY,JSON.stringify(dungeon));
 if(preferences)storage.set('spark-substrate-settings-v1',JSON.stringify(preferences));
 if(saved)storage.set('spark-substrate-descent-v2',JSON.stringify(saved));
 const context2d=new Proxy({measureText:t=>({width:t.length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),fillText:text=>drawn.push(text)},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
 const el=id=>{
  if(els.has(id))return els.get(id);
  const node={id,innerHTML:'',textContent:'',hidden:false,style:{setProperty(name,value){this[name]=value;}},dataset:{},classes:new Set(),attributes:{},handlers:new Map(),classList:{toggle(name,value){const e=els.get(id);if(value===true||value===undefined&&!e.classes.has(name))e.classes.add(name);else e.classes.delete(name);}},setAttribute(name,value){this.attributes[name]=value;},focus(options){document.activeElement=this;focuses.push({id,options});},addEventListener(type,fn){this.handlers.set(type,fn);},setPointerCapture(){},releasePointerCapture(){},querySelectorAll(){return this.children??[];},querySelector(selector){return {focus(options){focuses.push({id:selector,options});},setAttribute(){}};},getBoundingClientRect(){return {width:900,height:400,left:0,top:0};},getContext(){return context2d;},showModal(){this.open=true;this.returnFocus=document.activeElement;},close(){const wasOpen=this.open;this.open=false;if(!nativeFocusAfterClose)document.activeElement=this.returnFocus;if(wasOpen){const close=()=>{this.handlers.get('close')?.();if(nativeFocusAfterClose)document.activeElement=this.returnFocus;};if(deferredClose)closes.push(close);else close();}},remove(){removeChildren(id);els.delete(id);parents.delete(id);}};
  els.set(id,node);
  if(dom){let text='',content='';Object.defineProperties(node,{textContent:{get:()=>text+[...parents].filter(([,parent])=>parent===id).map(([child])=>els.get(child)?.textContent??'').join(''),set(value){removeChildren(id);text=String(value);content='';}},innerHTML:{get:()=>content,set(value){removeChildren(id);content=String(value);text='';markup(content,id);}}});}
  return node;
 };
 if(dom)markup(html);
 const dialogs=[...html.matchAll(/<dialog id="([^"]+)"/g)].map(([,id])=>el(id));
 const document={getElementById:dom?id=>els.get(id)??null:el,querySelector:selector=>selector==='dialog[open]'?dialogs.find(e=>e.open)??null:null,querySelectorAll:selector=>selector==='dialog'?dialogs:selector==='dialog[open]'?dialogs.filter(e=>e.open):[],addEventListener(type,fn,options){listeners.set(type,{fn,options});}};
 const window={matchMedia:()=>({matches:false}),devicePixelRatio:1,history:{scrollRestoration:'auto'},scrollTo:options=>scrolls.push(options),addEventListener(type,fn){listeners.set('window:'+type,{fn});}};
 const ClockDate=wallNow?class extends Date{static now(){return wallNow();}}:Date;
 const context=vm.createContext({...A,...Gear,...Worlds,...Mastery,...Records,...Settings,...Entry,...CombatView,...Dungeon,...Expansion,...Rematches,...Coop,...CoopInput,...Keepsakes,...Table,DuelScreen,SideScreen,saveRunCard,KEYS,doorId,ProgressSave,FORMS,validateSave,OnlineRoom:roomOptions?Room:OnlineRoom,CHAMBER_STORIES,ENEMY_LORE,performance:now?{now}:performance,document,window,sessionStorage,Image:class{constructor(){this.complete=true;this.naturalWidth=2172;this.naturalHeight=724;}addEventListener(){}},ResizeObserver:class{observe(){}},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},requestAnimationFrame(fn){if(!frames.includes(fn))frames.push(fn);},structuredClone,AbortController,console,Math,Date:ClockDate});
 vm.runInContext(fs.readFileSync(new URL('../public/descent.js',import.meta.url),'utf8').replace(/^import .*?;\n/gm,''),context);
 if(!entry){vm.runInContext("chooseProfile('pc');enterDescent()",context);focuses.length=0;}
 return {el,document,window,storage,sessionStorage,focuses,scrolls,drawn,flushCloses(){while(closes.length)closes.shift()();},flushFrames(time=now?.()??0){const pending=frames.splice(0);for(const frame of pending)frame(time);},run:code=>vm.runInContext(code,context),key(key,options={}){const event={key,code:key===' '?'Space':'',target:{tagName:'CANVAS'},repeat:false,prevented:false,preventDefault(){this.prevented=true;},...options};listeners.get('keydown').fn(event);return event;},listeners};
}
