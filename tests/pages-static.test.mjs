import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {buildPages,renderPagesIndex,OUTPUT,ROOT} from '../scripts/build-pages.mjs';

const source=path=>readFileSync(join(ROOT,'public',path),'utf8');
const deployed=path=>readFileSync(join(OUTPUT,path),'utf8');

test('generated Pages entry discloses local-only saves and sets the feature flag BEFORE game imports',()=>{
  const result=renderPagesIndex(source('index.html'));
  const flag=result.indexOf('window.SPARK_STATIC_PAGES=true');
  const app=result.indexOf('type="module" src="descent.js');
  assert.ok(flag>0&&app>flag,'flag is set before the game module executes');
  assert.match(result,/id="pages-edition-notice"/);
  assert.match(result,/Online co-op and cloud backup/);
  assert.match(result,/href="vr\/index.html"/);
  assert.match(result,/content="github-pages-static"/);
  assert.throws(()=>renderPagesIndex('<html>unfinished</html>'),/entry script changed/);
});
test('staged artifact contains only static assets and preserves the real game / XR / Arcade',()=>{
  const dir=buildPages();
  assert.equal(dir,OUTPUT);
  for(const path of [
    'index.html','descent.js','action-engine.js','online.js',
    'sprites.webp','spark-poster-v1.png','legacy/index.json',
    'legacy/first-sideways/index.html','legacy/first-sideways/game.js',
    'vr/index.html','vr/spark-vr-app.js','vr/spark-vr-model.js',
    'vr/spark-vr-renderer.js','vr/spark-vr-math.js','.nojekyll'
  ])assert.ok(existsSync(join(dir,path)),path+' must deploy');
  for(const path of ['server/rooms.mjs','server/progress.mjs',
    '.openai/hosting.json','package.json','.env','.github/workflows/pages.yml'])
    assert.ok(!existsSync(join(dir,path)),path+' must NOT deploy');
  assert.equal(deployed('vr/index.html'),source('vr/index.html'),
    'leave WebXR entry unmodified; its links are already relative');
  assert.equal(deployed('action-engine.js'),source('action-engine.js'),
    'preserve canonical Spark gameplay bytes');
  assert.equal(source('index.html').includes('window.SPARK_STATIC_PAGES=true'),false,
    'the full Worker-hosted site must not be switched to static mode');
});
test('static mode blocks room and cloud network attempts while retaining local save path',()=>{
  const js=source('descent.js');
  assert.match(js,/STATIC_PAGES=globalThis\.SPARK_STATIC_PAGES===true/);
  assert.match(js,/if\(STATIC_PAGES\)\{progress\?\.dispose\(\);progress=null;renderSaveStatus\(\);return;\}/);
  assert.match(js,/!STATIC_PAGES&&!online\.active/);
  assert.match(js,/!progress&&!STATIC_PAGES\)connectProgress\(\)/);
  assert.match(js,/if\(STATIC_PAGES\)throw Error\('Online rooms require/);
  assert.match(js,/\['entry-host','entry-join'\]/);
  assert.match(js,/localStorage\.setItem\(KEY,JSON\.stringify\(state\)\)/);
});
test('Memory Arcade original-source receipt URLs remain under GitHub project subpath',()=>{
  const js=source('memory-arcade.js');
  assert.ok(js.includes(`href="legacy/'+b.id+'/provenance.json`));
  assert.ok(!js.includes('href="/legacy/'));
});
test('all current game and VR relative ESM imports have deployed targets',()=>{
  const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
    const child=join(dir,entry.name);
    if(entry.isDirectory())return walk(child);
    return entry.isFile()&&child.endsWith('.js')?[child]:[];
  });
  const list=walk(OUTPUT).filter(path=>!path.includes('/legacy/'));
  let verified=0;
  for(const file of list){
    const js=readFileSync(file,'utf8');
    const re=/\b(?:from\s*|import\s*\(\s*|import\s*)['"]([^'"]+)['"]/g;
    for(const match of js.matchAll(re)){
      const importPath=match[1].split('?')[0].split('#')[0];
      if(!importPath.startsWith('./')&&!importPath.startsWith('../'))continue;
      const resolved=resolve(dirname(file),importPath);
      assert.ok(resolved.startsWith(OUTPUT+'/'),
        'no path traversal outside static artifact: '+importPath);
      assert.ok(existsSync(resolved),
        'missing local module for '+file.slice(OUTPUT.length+1)+' => '+importPath);
      verified++;
    }
  }
  assert.ok(verified>30,'verify a substantial real module graph');
});
test('canonical game, VR and Echo Lives HTML references stay project-relative',()=>{
  for(const name of ['index.html','vr/index.html','echo-lives.html']){
    const html=deployed(name);
    for(const [,ref] of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)){
      if(ref.startsWith('/')&&!ref.startsWith('//'))
        assert.fail(name+' has a root-absolute link: '+ref);
    }
  }
});
