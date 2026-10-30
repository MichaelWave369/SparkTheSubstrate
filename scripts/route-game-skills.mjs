import {access, readFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const safeRelative = p => typeof p === 'string' &&
  /^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(p) &&
  !p.split('/').includes('..') && !p.split('/').includes('.');
const safeVendor = p => typeof p === 'string' && (
  p === 'docs/game-skills/UPSTREAM-APACHE-2.0-LICENSE.txt' ||
  p === 'docs/game-skills/UPSTREAM-NOTICE.txt' ||
  /^\.agents\/skills\/[a-z0-9-]+\/(?:SKILL[.]md|(?:references|assets|scripts|agents)\/[a-zA-Z0-9_.-]+)$/.test(p)
);
const normalize = v => String(v).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const match = (task,terms) => terms.some(term => {
  const needle = normalize(term);
  return needle.length > 0 && (' ' + normalize(task) + ' ').includes(' ' + needle + ' ');
});
export async function readCatalog(root=ROOT) {
  return JSON.parse(await readFile(join(root,'.agents/game-skills.json'),'utf8'));
}
export function inspectCatalog(catalog) {
  const errors=[];
  if (catalog?.schema !== 'phi-game-skills/v1') errors.push('Unsupported schema');
  const p = catalog?.project;
  if (typeof p?.packageName !== 'string' || typeof p.engine !== 'string' ||
      !Array.isArray(p.requiredFiles) || !p.requiredFiles.length ||
      !p.requiredFiles.every(safeRelative)) errors.push('Invalid fingerprint');
  if (!Array.isArray(catalog?.skills) || !catalog.skills.length) {
    errors.push('Missing skills'); return errors;
  }
  const ids = new Set();
  for (const s of catalog.skills) {
    if (typeof s?.id !== 'string' || !SLUG.test(s.id)) {
      errors.push('Invalid skill ID'); continue;
    }
    if (ids.has(s.id)) errors.push('Duplicate skill ' + s.id);
    ids.add(s.id);
    if (s.file !== '.agents/skills/' + s.id + '/SKILL.md')
      errors.push('Unsafe skill path ' + s.id);
    if (!['local','upstream'].includes(s.source)) errors.push('Invalid source ' + s.id);
    if (s.always !== true && (!Array.isArray(s.keywords) ||
        !s.keywords.every(k => typeof k === 'string' && normalize(k).length > 0)))
      errors.push('Invalid triggers ' + s.id);
  }
  if (catalog.skills[0]?.always !== true || catalog.skills[0]?.source !== 'local')
    errors.push('First skill must be local authority');
  if (!Array.isArray(catalog.vendorFiles) ||
      !catalog.vendorFiles.every(safeVendor) ||
      catalog.vendorFiles.length !== new Set(catalog.vendorFiles).size)
    errors.push('Unsafe vendor file list');
  return errors;
}
export async function detectEngine(catalog,root=ROOT) {
  try {
    if (inspectCatalog(catalog).length) return 'unknown';
    const pkg = JSON.parse(await readFile(join(root,'package.json'),'utf8'));
    if (pkg.name !== catalog.project.packageName) return 'unknown';
    await Promise.all(catalog.project.requiredFiles.map(path => access(join(root,path))));
    return catalog.project.engine;
  } catch { return 'unknown'; }
}
export function selectSkills(task,catalog) {
  if (typeof task !== 'string' || !task.trim()) throw Error('A nonempty task is required');
  const errors = inspectCatalog(catalog);
  if (errors.length) throw Error('Invalid skills manifest: '+errors.join('; '));
  return catalog.skills.filter(s => s.always === true || match(task,s.keywords))
    .map(s => ({id:s.id,file:s.file,source:s.source}));
}
export async function routeTask(task,{root=ROOT,load=false}={}) {
  const catalog=await readCatalog(root);
  const engine=await detectEngine(catalog,root);
  if (engine==='unknown') throw Error('Unknown Spark fingerprint; refusing to guess engine');
  const skills=selectSkills(task,catalog);
  const result={schema:catalog.schema,engine,task,skills};
  if (load) result.contents=await Promise.all(skills.map(async s=>({
    id:s.id,content:await readFile(join(root,s.file),'utf8')
  })));
  return result;
}
export async function validateCatalog(root=ROOT) {
  let catalog;
  try { catalog=await readCatalog(root); }
  catch(e){ return {ok:false,errors:['Manifest unreadable: '+e.message]}; }
  const errors=inspectCatalog(catalog);
  if (!errors.length && await detectEngine(catalog,root)==='unknown') errors.push('Fingerprint mismatch');
  for(const s of catalog.skills||[]) {
    if(typeof s?.id!=='string'||!SLUG.test(s.id)||!safeRelative(s.file))continue;
    try {
      const body=await readFile(join(root,s.file),'utf8');
      const front=body.split('---',3)[1]?.split('\n')||[];
      if(!body.startsWith('---\n')||!front.includes('name: '+s.id)||
         !front.some(line=>line.startsWith('description:')))
        errors.push('Invalid metadata '+s.id);
    } catch{ errors.push('Missing skill '+s.id); }
  }
  for(const p of catalog.vendorFiles||[]) {
    if(!safeVendor(p))continue;
    try { await access(join(root,p)); }
    catch{ errors.push('Missing vendor file '+p); }
  }
  return {ok:errors.length===0,engine:catalog.project?.engine,
    skills:catalog.skills?.length||0,vendorFiles:catalog.vendorFiles?.length||0,errors};
}
async function main(args) {
  if(args.includes('--validate')){
    const res=await validateCatalog();console.log(JSON.stringify(res,null,2));
    if(!res.ok)process.exitCode=1;
    return;
  }
  if(args.includes('--list')){
    const c=await readCatalog();console.log(JSON.stringify(c.skills,null,2));return;
  }
  const i=args.indexOf('--task');
  const task=i>=0?args[i+1]:null;
  if(!task||task.startsWith('--'))throw Error('Usage: --task "task" [--json] [--load] or --validate or --list');
  const result=await routeTask(task,{load:args.includes('--load')});
  if(args.includes('--json')||args.includes('--load'))console.log(JSON.stringify(result,null,2));
  else result.skills.forEach(s=>console.log(s.file));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
