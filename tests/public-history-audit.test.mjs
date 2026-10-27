import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeText,classifyPath,redactedSummary} from '../scripts/audit-public-history.mjs';

const sha='a'.repeat(40);
const secure=Buffer.from('regular game geometry and benign configuration');
const dummyToken='ghp_'+'X'.repeat(34);
const leaked=Buffer.from('credential = '+dummyToken);
const clean=()=>redactedSummary({
  commitCount:2,branchCount:1,
  blobPaths:[{id:sha,path:'public/game.js'}],
  blobRecords:[{id:sha,size:secure.length}],
  scanBlob:()=>secure
});
test('clean, bounded fixture has no indicators but remains advisory only',()=>{
  const report=clean();
  assert.equal(report.status,'NO_INDICATORS_IN_SCANNED_TEXT');
  assert.equal(report.qualification,'ADVISORY_ONLY_NOT_A_PUBLIC_RELEASE_CLEARANCE');
  assert.ok(report.unreviewed_gates.includes('HISTORICAL_ACTIONS_LOGS_AND_ARTIFACTS'));
  assert.equal(report.text_blobs_scanned,1);
});
test('token-like indicators are classified without recording actual match values',()=>{
  const report=redactedSummary({
    commitCount:5,branchCount:2,
    blobPaths:[{id:sha,path:'server/access.js'}],
    blobRecords:[{id:sha,size:leaked.length}],
    scanBlob:()=>leaked
  });
  assert.equal(report.status,'MANUAL_REVIEW_REQUIRED');
  assert.equal(report.indicator_counts['github-token'],1);
  assert.ok(!JSON.stringify(report).includes(dummyToken));
  assert.ok(!JSON.stringify(report).includes('server/access.js'));
});
test('historic sensitive file paths require private review, without disclosing names',()=>{
  assert.equal(classifyPath('.env.production'),'sensitive-filename');
  assert.equal(classifyPath('server/secret.key'),'sensitive-filename');
  assert.equal(classifyPath('public/game.js'),null);
  const report=redactedSummary({
    commitCount:3,branchCount:2,
    blobPaths:[{id:sha,path:'.env.production'}],
    blobRecords:[{id:sha,size:secure.length}],
    scanBlob:()=>secure
  });
  assert.equal(report.indicator_counts['sensitive-filename'],1);
  assert.ok(!JSON.stringify(report).includes('.env.production'));
});
test('detects high-specificity key signatures without returning the value',()=>{
  const privateKey='-----BEGIN '+'PRIVATE KEY-----';
  assert.ok(analyzeText(privateKey).includes('private-key-block'));
  assert.ok(analyzeText('sk_live_'+'a'.repeat(25)).includes('payment-secret-key'));
  assert.ok(analyzeText('github_pat_'+'Q'.repeat(50)).includes('github-token'));
  assert.deepEqual(analyzeText('this is an MIT game and the world is large'),[]);
});
test('skips binary/unknown files rather than scanning or treating them as verified',()=>{
  const report=redactedSummary({
    commitCount:1,branchCount:1,
    blobPaths:[{id:sha,path:'public/sprite.webp'}],
    blobRecords:[{id:sha,size:secure.length}],
    scanBlob:()=>{throw Error('should not read raster image');}
  });
  assert.equal(report.binary_or_unsupported_blobs,1);
  assert.equal(report.text_blobs_scanned,0);
  assert.equal(report.qualification,'ADVISORY_ONLY_NOT_A_PUBLIC_RELEASE_CLEARANCE');
});
test('records missing contents and scan failures without leaking exception details',()=>{
  const report=redactedSummary({
    commitCount:1,branchCount:1,
    blobPaths:[{id:sha,path:'server/rooms.js'}],
    blobRecords:[{id:sha,size:secure.length}],
    scanBlob:()=>{throw Error('private source content must never appear in output');}
  });
  assert.equal(report.scan_errors,1);
  assert.equal(report.status,'MANUAL_REVIEW_REQUIRED');
  assert.ok(!JSON.stringify(report).includes('private source content'));
});
