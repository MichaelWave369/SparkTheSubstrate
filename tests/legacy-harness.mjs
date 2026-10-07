import fs from 'node:fs';
import vm from 'node:vm';
// Runs the actual frozen classic bundle and safety runtime, not a current engine
// with a historical label. A DOM harness cannot assert browser sandbox enforcement.
export function legacyUI(id,store={},options={}) {
  const html=fs.readFileSync(new URL('../public/legacy/'+id+'/index.html',import.meta.url),'utf8');
  const bundle=fs.readFileSync(new URL('../public/legacy/'+id+'/game.js',import.meta.url),'utf8');
  const shell=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
  const nodes=new Map(),listeners=new Map(),messages=[],timers=new Map(),frames=new Map(),metas=new Map();let serial=0,context,document;
  const discard=node=>{for(const child of node.children)discard(child);if(nodes.get(node.id)===node)nodes.delete(node.id);};
  const canvas=new Proxy({measureText:t=>({width:String(t).length*6}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),getImageData:()=>({data:new Uint8ClampedArray(4)})},{get:(o,k)=>k in o?o[k]:(()=>{}),set:(o,k,v)=>(o[k]=v,true)});
  const unescape=s=>s.replaceAll('&quot;','"').replaceAll('&lt;','<').replaceAll('&amp;','&');
  const matches=(node,selector)=>{
    if(selector==='dialog[open]')return node.tagName==='DIALOG'&&node.open;
    if(selector==='dialog')return node.tagName==='DIALOG';
    if(selector==='button:not([disabled])')return node.tagName==='BUTTON'&&!node.disabled;
    if(selector==='button')return node.tagName==='BUTTON';
    const action=selector.match(/\[data-action="([^"]+)"\]/);if(action)return node.dataset.action===action[1];
    if(selector==='[data-action]')return !!node.dataset.action;
    if(selector.startsWith('#'))return node.id===selector.slice(1);
    if(selector.startsWith('.'))return node.className?.split(' ').includes(selector.slice(1));
    return node.tagName===selector.toUpperCase();
  };
  function create(tag='div',id='anon-'+(++serial)) {
    const node={id,tagName:tag.toUpperCase(),children:[],parentNode:null,style:{setProperty(k,v){this[k]=v;}},dataset:{},attrs:{},handlers:new Map(),hidden:false,disabled:false,value:'',scrollTop:0,width:960,height:540,className:'',
      classList:{toggle(){},add(){},remove(){}},setAttribute(k,v){this.attrs[k]=String(v);},getAttribute(k){return this.attrs[k]??null;},focus(){document.activeElement=this;},scrollIntoView(){},setPointerCapture(){},releasePointerCapture(){},
      getBoundingClientRect(){return {width:this.hidden?0:960,height:540,left:0,top:0,right:960,bottom:540};},getContext(){return canvas;},addEventListener(k,fn){this.handlers.set(k,fn);},
      querySelectorAll(selector){const found=[];const walk=n=>{for(const child of n.children){if(matches(child,selector))found.push(child);walk(child);}};walk(this);return found;},querySelector(selector){return this.querySelectorAll(selector)[0]??null;},
      closest(selector){return matches(this,selector)?this:this.parentNode?.closest(selector)??null;},showModal(){this.open=true;},close(){this.open=false;this.handlers.get('close')?.();},
      append(child){child.parentNode=this;this.children.push(child);if(child.tagName==='SCRIPT'&&child.textContent)vm.runInContext(child.textContent,context,{filename:id+'/game.js'});},
      remove(){if(this.parentNode)this.parentNode.children=this.parentNode.children.filter(n=>n!==this);nodes.delete(this.id);},
      click(){document.dispatchEvent({type:'click',target:this,preventDefault(){}});},dispatchEvent(event){event.target=this;document.dispatchEvent(event);return true;}
    };
    let text='',content='';Object.defineProperties(node,{textContent:{get:()=>text,set:v=>{text=String(v);for(const child of node.children)discard(child);node.children=[];}},innerHTML:{get:()=>content,set:v=>{content=String(v);for(const child of node.children)discard(child);node.children=[];parse(content,node);}}});nodes.set(id,node);return node;
  }
  function parse(source,parent){const stack=[parent];const voids=new Set(['META','LINK','IMG','INPUT','BR','HR','SOURCE']);
    for(const match of source.matchAll(/<\/?([a-z][\w:-]*)\b([^>]*)>/gi)){
      if(match[0].startsWith('</')){if(stack.length>1)stack.pop();continue;}
      const attrs=match[2],tag=match[1],id=attrs.match(/\bid="([^"]+)"/)?.[1];const node=create(tag,id??'anon-'+(++serial));
      for(const [,,name,value]of attrs.matchAll(/(?:^|\s)(([\w-]+))="([^"]*)"/g)){
        const val=unescape(value);node.attrs[name]=val;if(name.startsWith('data-'))node.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=val;
        if(name==='class')node.className=val;if(name==='value')node.value=val;if(name==='content')node.content=val;
      }
      node.hidden=/\bhidden\b/.test(attrs);node.disabled=/\bdisabled\b/.test(attrs);node.parentNode=stack.at(-1);stack.at(-1).children.push(node);
      if(tag==='meta'&&node.attrs.name)metas.set(node.attrs.name,node);
      if(!voids.has(node.tagName))stack.push(node);
    }
  }
  const root=create('html','harness-root'),body=create('body','harness-body');root.children.push(body);body.parentNode=root;
  document={body,activeElement:body,hidden:false,modelContext:null,getElementById:id=>nodes.get(id)??null,createElement:tag=>create(tag),hasFocus:()=>true,
    querySelector:selector=>{const meta=selector.match(/^meta\[name="([^"]+)"\]$/);return meta?metas.get(meta[1]):[...nodes.values()].find(n=>matches(n,selector))??null;},
    querySelectorAll:selector=>[...nodes.values()].filter(n=>matches(n,selector)),addEventListener(type,fn){const a=listeners.get(type)??[];a.push(fn);listeners.set(type,a);},dispatchEvent(event){for(const fn of listeners.get(event.type)??[])fn(event);}};
  parse(shell,body);const program=create('script','legacy-program');program.textContent=bundle;body.children.push(program);
  const windowListeners=new Map(),parent={postMessage:data=>{if(['legacy-save','legacy-observation'].includes(data.type)){const old=messages.findIndex(m=>m.type===data.type);if(old>=0)messages.splice(old,1);}messages.push(structuredClone(data));}};
  const globals={document,parent,navigator:{getGamepads:()=>[]},console,structuredClone,Response,AbortController,performance,Math,Date,Uint8Array,Blob,URL,
    history:{scrollRestoration:'auto'},location:{href:'https://local/legacy/'+id+'/index.html'},devicePixelRatio:1,matchMedia:()=>({matches:false}),scrollTo(){},queueMicrotask:fn=>fn(),
    addEventListener(type,fn){const a=windowListeners.get(type)??[];a.push(fn);windowListeners.set(type,a);},dispatchEvent(event){for(const fn of windowListeners.get(event.type)??[])fn(event);},
    requestAnimationFrame:fn=>{const n=++serial;frames.set(n,fn);return n;},cancelAnimationFrame:id=>frames.delete(id),setInterval:fn=>{const n=++serial;timers.set(n,fn);return n;},clearInterval:id=>timers.delete(id),setTimeout:fn=>{const n=++serial;return n;},clearTimeout(){},
    Image:class{constructor(){this.complete=true;this.naturalWidth=2154;this.naturalHeight=2154;}addEventListener(){}},ResizeObserver:class{observe(){}},
    Event:class{constructor(type){this.type=type;}},KeyboardEvent:class{constructor(type,data){Object.assign(this,{type,...data});}preventDefault(){}stopImmediatePropagation(){}},localStorage:{},sessionStorage:{},fetch(){throw Error('Unbridged fetch.');}};
  globals.window=globals;context=vm.createContext(globals);vm.runInContext(fs.readFileSync(new URL('../public/legacy-runtime.js',import.meta.url),'utf8'),context,{filename:'legacy-runtime.js'});
  const session=options.session??'0123456789abcdef0123456789abcdef';const send=(type,extra={})=>{const event={source:parent,data:{type,build:id,session,...extra}};for(const fn of windowListeners.get('message')??[])fn(event);};
  send('legacy-init',{store,muted:true});
  return {window:globals,document,nodes,messages,timers,frames,send,session,parent,run:code=>vm.runInContext(code,context),observe(){for(const fn of [...timers.values()])fn();return messages.findLast(m=>m.type==='legacy-observation')?.proof;},storage:()=>messages.findLast(m=>m.type==='legacy-save')?.store};
}
