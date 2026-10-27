#!/usr/bin/env node
/**
 * Read-only, redacted pre-publication Git-history audit.
 * Heuristic indicators are NOT proof of secrets or proof of a safe public release.
 * Raw matches, paths, filenames, and file contents are never printed or uploaded.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const MAX_OBJECTS = 120000;
const MAX_SCAN_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_SCAN = 256 * 1024 * 1024;
const ALLOWED_TEXT = /\.(?:js|mjs|cjs|jsx|ts|tsx|mts|cts|json|jsonc|html|css|svg|md|mdx|txt|yml|yaml|toml|xml|sql|py|sh|bash|ps1|env|npmrc|ini|cfg|properties|pem|key)$/i;
const PRIVATE_PATH = /(?:^|\/)(?:\.env(?:\.[^/]*)?|id_(?:rsa|ed25519)|credentials(?:\.[a-z0-9]+)?|secrets?\.[a-z0-9]+|\.npmrc|[^/]+\.(?:pem|key|p12|pfx|sqlite|db|bak))$/i;
const matchers = Object.freeze({
  'private-key-block': /-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/,
  'github-token': /(?:gh[pousr]_[A-Za-z0-9_]{25,}|github_pat_[A-Za-z0-9_]{40,})/,
  'cloud-credential-id': /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/,
  'payment-secret-key': /\b(?:sk|rk)_live_[a-zA-Z0-9]{16,}\b/,
  'embedded-basic-auth-url': /https?:\/\/[^\s/"'@]+:[^\s/"'@]+@[^\s/"']+/,
  'sensitive-credential-assignment': /(?:password|private[_-]?token|client[_-]?secret|access[_-]?token|api[_-]?key)\s*[:=]\s*["']?[a-zA-Z0-9_+\/-]{28,}/i
});
function git(args,{input,encoding='utf8',maxBuffer=96*1024*1024}={}){
  return execFileSync('git',args,{input,encoding,maxBuffer,stdio:['pipe','pipe','pipe']});
}
export function analyzeText(input){
  const text=String(input);
  return Object.entries(matchers).filter(([,regex])=>regex.test(text)).map(([name])=>name);
}
export function classifyPath(path){
  return PRIVATE_PATH.test(String(path))?'sensitive-filename':null;
}
function bump(map,key){map[key]=(map[key]||0)+1;}
export function redactedSummary({commitCount,branchCount,blobPaths,blobRecords,scanBlob}){
  const evidence={},fileNames=new Set(),objectPaths=new Map();
  for(const {id,path} of blobPaths){
    if(path&&!objectPaths.has(id))objectPaths.set(id,path);
    if(path&&classifyPath(path))fileNames.add(path);
  }
  for(const path of fileNames)bump(evidence,'sensitive-filename');
  let scanned=0,bytes=0,oversized=0,binaryOrUnsupported=0,scanErrors=0;
  let total=0,limitHit=false;
  for(const blob of blobRecords){
    total++;
    if(total>MAX_OBJECTS){limitHit=true;break;}
    const path=objectPaths.get(blob.id)||'';
    if(!path||!ALLOWED_TEXT.test(path)||!/^[a-f0-9]{40,64}$/.test(blob.id)){
      binaryOrUnsupported++;continue;
    }
    if(blob.size>MAX_SCAN_BYTES||bytes+blob.size>MAX_TOTAL_SCAN){
      oversized++;continue;
    }
    try {
      const payload=scanBlob(blob.id);
      if(!Buffer.isBuffer(payload)||payload.length!==blob.size){
        scanErrors++;continue;
      }
      if(payload.includes(0)){binaryOrUnsupported++;continue;}
      scanned++;bytes+=payload.length;
      for(const label of analyzeText(payload.toString('utf8')))bump(evidence,label);
    } catch { scanErrors++; }
  }
  return {
    schema:'spark.private-release-history-review.v1',
    status:Object.keys(evidence).length||limitHit||oversized||scanErrors?
      'MANUAL_REVIEW_REQUIRED':'NO_INDICATORS_IN_SCANNED_TEXT',
    qualification:'ADVISORY_ONLY_NOT_A_PUBLIC_RELEASE_CLEARANCE',
    commits:commitCount,
    remote_branches:branchCount,
    unique_blobs:blobRecords.length,
    text_blobs_scanned:scanned,
    text_bytes_scanned:bytes,
    binary_or_unsupported_blobs:binaryOrUnsupported,
    oversized_or_budget_skipped:oversized,
    scan_errors:scanErrors,
    object_limit_reached:limitHit,
    indicator_counts:evidence,
    unreviewed_gates:[
      'HISTORICAL_ACTIONS_LOGS_AND_ARTIFACTS',
      'ORIGINAL_AND_ARCHIVED_ARTWORK_RIGHTS',
      'BACKEND_AUTHORIZATION_AND_ABUSE_RESILIENCE',
      'REAL_QUEST_3_ACCEPTANCE',
      'PERSONAL_INFORMATION_AND_DEPLOYMENT_METADATA_REVIEW',
      'FINAL_OWNER_VISIBILITY_APPROVAL'
    ],
    note:'Heuristic scan of reachable local Git blobs only. No matched strings, paths, secret values, or source snippets were emitted.'
  };
}
export function auditGitHistory(){
  const objects=git(['rev-list','--objects','--all']).trim().split('\n')
    .filter(Boolean).map(line=>{
      const match=/^([a-f0-9]{40,64})(?: (.*))?$/.exec(line);
      if(!match)throw Error('Unexpected Git object listing.');
      return {id:match[1],path:match[2]||''};
    });
  if(objects.length>MAX_OBJECTS)throw Error('History object budget exceeded: manual/offline audit required.');
  const unique=[...new Set(objects.map(x=>x.id))];
  const checked=git(['cat-file','--batch-check=%(objectname) %(objecttype) %(objectsize)'],
    {input:unique.join('\n')+'\n'}).trim().split('\n');
  const blobs=checked.map(line=>{
    const match=/^([a-f0-9]{40,64}) blob (\d+)$/.exec(line);
    return match?{id:match[1],size:Number(match[2])}:null;
  }).filter(Boolean);
  const count=Number(git(['rev-list','--all','--count']).trim());
  const branches=git(['for-each-ref','--format=%(refname)','refs/heads','refs/remotes'])
    .split('\n').filter(x=>x.trim()&&!x.includes('/HEAD')).length;
  return redactedSummary({
    commitCount:count,branchCount:branches,
    blobPaths:objects,blobRecords:blobs,
    scanBlob:id=>git(['cat-file','blob',id],{encoding:null,maxBuffer:MAX_SCAN_BYTES+1024})
  });
}
function humanOutput(result){
  const lines=[
    'SPARK PUBLIC-RELEASE GIT HISTORY PRECHECK',
    'Status: '+result.status+' (advisory, not permission to publish)',
    'Reachable commits: '+result.commits,
    'Available local/remote refs: '+result.remote_branches,
    'Unique blobs: '+result.unique_blobs,
    'Text blobs scanned: '+result.text_blobs_scanned,
    'Unscanned oversized/budget blobs: '+result.oversized_or_budget_skipped,
    'Scan errors: '+result.scan_errors,
    'Filename/content indicator counts (no values or paths):'
  ];
  for(const [type,count] of Object.entries(result.indicator_counts))
    lines.push('  '+type+': '+count);
  lines.push('Further manual checks: prior Actions logs/artifacts, art rights, backend, Quest hardware, privacy, owner consent.');
  return lines.join('\n');
}
const invoked=process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1];
if(invoked){
  try{
    const report=auditGitHistory();
    console.log(humanOutput(report));
    if(process.env.GITHUB_STEP_SUMMARY){
      const safe=[
        '## Spark private public-release history precheck',
        'Status: **'+report.status+'** (advisory only, not publication approval)',
        'Commits: '+report.commits+'; blobs scanned: '+report.text_blobs_scanned+
          '; skipped large: '+report.oversized_or_budget_skipped+'; errors: '+report.scan_errors,
        'Indicators by class: '+JSON.stringify(report.indicator_counts),
        'Still required: historical Actions logs and artifacts, art licenses, backend review, Quest testing and owner approval.'
      ].join('\n\n');
      appendFileSync(process.env.GITHUB_STEP_SUMMARY,safe+'\n');
    }
    // A successful *scan run* is NOT a statement of release readiness.
    process.exitCode=report.scan_errors||report.object_limit_reached?2:0;
  }catch{
    // Never dump git output or potentially sensitive command errors to CI logs.
    console.error('History scan incomplete; manual private review required.');
    process.exitCode=2;
  }
}
