#!/usr/bin/env node
/**
 * Produces a static-only GitHub Pages edition from the original game assets.
 * Cloudflare Worker/D1 and development files are never bundled.
 * The source public/ folder remains unchanged.
 */
import {cpSync,existsSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const OUTPUT=join(ROOT,'.pages-site');

export function renderPagesIndex(source){
  const script='<script type="module" src="descent.js?v=0.17.0"></script>';
  if(source.split(script).length!==2)
    throw Error('Spark Pages build: game entry script changed; review static mode injection.');
  const header='</head><body>';
  if(source.split(header).length!==2)
    throw Error('Spark Pages build: document head changed; review static edition.');
  const anchor='<div class="input-profiles"';
  if(source.split(anchor).length!==2)
    throw Error('Spark Pages build: start screen changed; review static edition.');
  const banner=[
    '<aside id="pages-edition-notice" role="note" aria-label="Static edition details">',
    '<strong>FREE · OPEN SOURCE · LOCAL FIRST</strong>',
    '<span>This GitHub Pages edition supports solo journeys, Duel, Sideways,',
    ' Memory Arcade and the experimental two-room VR preview.',
    ' Saves are stored in this browser. Online co-op and cloud backup',
    ' are available only in the separate fully hosted version.</span>',
    '</aside>'
  ].join('');
  const style=`<meta name="spark-edition" content="github-pages-static">
<style>
#pages-edition-notice{display:grid;gap:7px;border:1px solid #d5b37e;
background:#183033;padding:13px 16px;margin:14px 0;color:#e6e5ce;
font-size:.85rem;line-height:1.5}
#pages-edition-notice strong{color:#f1d29a;letter-spacing:.08em}
</style>`;
  return source.replace(script,
    '<script>window.SPARK_STATIC_PAGES=true;</script>'+script)
    .replace(header,style+header)
    .replace(anchor,banner+anchor);
}
export function buildPages(){
  const source=join(ROOT,'public');
  if(!existsSync(join(source,'index.html'))||!existsSync(join(source,'vr','index.html')))
    throw Error('Spark Pages build: canonical game or VR entry missing.');
  rmSync(OUTPUT,{recursive:true,force:true});
  mkdirSync(OUTPUT,{recursive:true});
  cpSync(source,OUTPUT,{recursive:true,force:true,filter:entry=>{
    // Header rules are host-specific; GitHub Pages does not interpret _headers.
    return !entry.endsWith('/_headers')&&!entry.endsWith('\\_headers');
  }});
  const index=join(OUTPUT,'index.html');
  writeFileSync(index,renderPagesIndex(readFileSync(index,'utf8')));
  writeFileSync(join(OUTPUT,'.nojekyll'),'');
  // Fail rather than accidentally uploading a Pages edition with missing imports.
  if(!existsSync(join(OUTPUT,'vr','spark-vr-app.js'))||
     !existsSync(join(OUTPUT,'legacy','index.json'))||
     !existsSync(join(OUTPUT,'action-engine.js')))
    throw Error('Spark Pages build: required independent game modes missing.');
  return OUTPUT;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    console.log('Spark static Pages artifact built:',buildPages());
    console.log('Scope: solo + Arcade + experimental VR; no backend or cloud service.');
  }catch{
    console.error('Spark static Pages build failed; inspect local source paths and CI tests.');
    process.exitCode=1;
  }
}
