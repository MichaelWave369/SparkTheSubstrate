// Freeze actual Git states; retain their sources and verify every blob before bundling.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {LEGACY_BUILDS} from '../public/memory-arcade-manifest.js';
const require=createRequire(import.meta.url),{build}=require(createRequire(require.resolve('vite')).resolve('esbuild'));
const root=process.cwd(),target=path.join(root,'public/legacy'),scratch=fs.mkdtempSync(path.join(os.tmpdir(),'spark-legacy-'));
const sha=data=>createHash('sha256').update(data).digest('hex');
const cspHash=data=>"'sha256-"+createHash('sha256').update(data).digest('base64')+"'";
const attr=s=>String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const runtime=fs.readFileSync(path.join(root,'public/legacy-runtime.js'),'utf8');
const receipts=[];
try {
  for(const entry of LEGACY_BUILDS){
    const checkout=path.join(scratch,entry.id),out=path.join(target,entry.id);fs.mkdirSync(checkout,{recursive:true});fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
    const files=execFileSync('git',['ls-tree','-r','--name-only',entry.commit,entry.sourceRoot],{encoding:'utf8'}).trim().split('\n');
    const sources=[];let sourceBytes=0;
    for(const name of files){
      const relative=name.slice(entry.sourceRoot.length+1),bytes=execFileSync('git',['show',entry.commit+':'+name],{maxBuffer:30*1024*1024});
      const dest=path.join(checkout,relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);
      const text=/\.(?:js|html|css)$/.test(relative)||relative.startsWith('_');
      if(text){const preserve=path.join(out,'source',relative);fs.mkdirSync(path.dirname(preserve),{recursive:true});fs.writeFileSync(preserve,bytes);}
      sources.push({file:name,frozen:text?'source/'+relative:relative,sha256:sha(bytes),bytes:bytes.length});sourceBytes+=bytes.length;
      if(!relative.endsWith('.js')&&!relative.endsWith('.html')&&!relative.endsWith('.css')&&!relative.startsWith('_')){const asset=path.join(out,relative);fs.mkdirSync(path.dirname(asset),{recursive:true});fs.writeFileSync(asset,bytes);}
    }
    const script=entry.mode==='echo'?'app.js':'descent.js';
    const bundled=await build({absWorkingDir:checkout,entryPoints:[script],bundle:true,write:false,format:'iife',target:'es2022',minify:false,legalComments:'inline',logLevel:'silent'});
    const code=bundled.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');fs.writeFileSync(path.join(out,'game.js'),code);
    let html=fs.readFileSync(path.join(checkout,'index.html'),'utf8');
    // Only presentation/loading/security wrappers differ. Historical sources above remain byte exact.
    html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'').replace(/<link\b[^>]*(?:rel="stylesheet"|rel="preload")[^>]*>/gi,'');
    let css=fs.readFileSync(path.join(checkout,entry.mode==='echo'?'style.css':'descent.css'),'utf8').replace(/@import\s+url\([^)]*\)\s*;/g,'');
    css+='\n/* Cabinet wrapper: never hide the archive return controls outside this frame. */\nhtml,body{min-width:0}body{margin:0}';
    // Explicit scoped image host also supports WebKit versions which evaluate
    // 'self' against the opaque sandbox origin rather than the response URL.
    const imageHost='https://spark-substrate.microneesia79.chatgpt.site/legacy/'+entry.id+'/';
    const policy="default-src 'none'; script-src "+cspHash(runtime)+' '+cspHash(code)+"; style-src 'unsafe-inline'; img-src 'self' "+imageHost+" data: blob:; media-src 'self'; connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";
    html=html.replace('</head>','<meta http-equiv="Content-Security-Policy" content="'+attr(policy)+'"><meta name="legacy-id" content="'+entry.id+'"><meta name="legacy-mode" content="'+entry.mode+'"><meta name="legacy-keys" content="'+attr(JSON.stringify(entry.keys))+'"><style>'+css+'</style></head>');
    html=html.replace('</body>','<script type="text/plain" id="legacy-program">'+code+'</script><script>'+runtime+'</script></body>');
    fs.writeFileSync(path.join(out,'index.html'),html);
    const receipt={id:entry.id,title:entry.title,version:entry.version,authenticity:entry.authenticity,commit:entry.commit,sourceRoot:entry.sourceRoot,sourceBytes,sources,
      wrapper:'opaque sandbox; classic bundle; inert source until storage handshake; CSP script hashes; device bridge',
      bundler:'esbuild '+require(createRequire(require.resolve('vite')).resolve('esbuild')).version,
      bundleSha256:sha(code),runtimeSha256:sha(runtime),htmlSha256:sha(html),removed:'external font imports only; system fallbacks remain',bytes:{html:Buffer.byteLength(html),bundle:Buffer.byteLength(code)}};
    fs.writeFileSync(path.join(out,'provenance.json'),JSON.stringify(receipt,null,2)+'\n');receipts.push({id:entry.id,version:entry.version,commit:entry.commit,sourceBytes,htmlBytes:Buffer.byteLength(html)});
  }
  fs.writeFileSync(path.join(target,'index.json'),JSON.stringify(receipts,null,2)+'\n');console.log(JSON.stringify(receipts,null,2));
} finally {fs.rmSync(scratch,{recursive:true,force:true});}
