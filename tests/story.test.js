'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), os = require('node:os'), vm = require('node:vm');
const { execFileSync, spawnSync } = require('node:child_process');
const E = require('../src/engine.js'), S = require('../src/story.js'), { generateEpisode, ENDPOINT } = require('../src/llm.js');
const { reader } = require('../scripts/episode.js');
const root = path.resolve(__dirname, '..'), sample = require('../episodes/consequence/script.json');
const saved = require('../episodes/consequence/dossier.json'), copy = x => JSON.parse(JSON.stringify(x));
const near = (a, b, tolerance = 1e-8) => assert.ok(Math.abs(a - b) < tolerance, a + ' differs from ' + b);
function response(script = sample, extra = {}) {
  return { ok: true, json: async () => ({ id: 'mock-id', model: 'test-model', status: 'completed',
    output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(script) }] }], ...extra }) };
}
const apiOptions = { apiKey: 'nonfunctional-test-key', model: 'test-model' };

test('consequence scenario reproduces its actual dossier and all six interventions', () => {
  const sim = S.scenario(), d = S.dossier(sim.exportRecord());
  assert.equal(sim.steps, 560); assert.equal(d.runId, saved.runId); assert.equal(d.beats.length, 15);
  assert.deepEqual(d.source.interventions, saved.source.interventions);
  d.beats.forEach((b, i) => { assert.deepEqual(b.actions, saved.beats[i].actions); for (const k of ['record','coherence','outside','fieldEnergy','fieldAmplitude']) near(b.metrics[k], saved.beats[i].metrics[k]); });
  near(d.beats[4].metrics.outside, 0); near(d.beats[5].metrics.outside, 0.258752933);
  near(d.beats[6].metrics.record, d.beats[2].metrics.record);
  near(d.beats[10].metrics.record, 0);
  assert.ok(d.beats[14].metrics.fieldEnergy < d.beats[12].metrics.fieldEnergy);
  assert.ok(d.beats[14].metrics.fieldAmplitude > d.beats[12].metrics.fieldAmplitude);
  assert.deepEqual(d.beats[14].metrics.populations, d.beats[12].metrics.populations);
});

test('dossier recomputes measurements and groups same-time endpoint interventions', () => {
  const sim = new E.Simulation({lab:'memory',scripted:false}); sim.step(40);
  sim.action({type:'record',world:1}); sim.action({type:'swap',a:1,b:3});
  const record = sim.exportRecord(); record.result = { trace: -999, outside: 99 };
  const d = S.dossier(record), end = d.beats.at(-1);
  near(d.source.result.trace, 1); assert.equal(end.actions.length, 2); assert.equal(end.time, 1);
  near(end.metrics.record, sim.metrics().record);
  assert.equal(S.dossier(new E.Simulation({lab:'portal'}).exportRecord()).beats.length, 1);
  assert.throws(() => S.dossier({...record,steps:-1}), /replay length/);
});

test('all six delivered prompt packs are measured and remain replayable', () => {
  for (const lab of E.SERIES) {
    const dir = path.join(root, 'episodes/series', lab.id), record = JSON.parse(fs.readFileSync(path.join(dir,'run.json')));
    const d = S.dossier(record), stored = JSON.parse(fs.readFileSync(path.join(dir,'dossier.json')));
    assert.equal(d.runId, stored.runId); assert.equal(d.lab, lab.id); assert.equal(d.duration, 8);
    assert.ok(fs.readFileSync(path.join(dir,'prompt.txt'),'utf8').includes(d.runId));
    near(d.beats.at(-1).metrics.trace, 1);
  }
});

test('dossier caps long event lists instead of silently dropping interventions', () => {
  const sim = new E.Simulation({lab:'portal',scripted:false});
  for(let i=0;i<49;i++) sim.action({type:'parameters',values:{coupling:i%2}});
  assert.throws(() => S.dossier(sim.exportRecord()), /48 interventions/);
  assert.throws(() => S.prompt(saved,'a'.repeat(1201)), /1,200/);
});

test('sample covers all acts and every intervention; audit and screenplay correspond', () => {
  const checks = S.validate(sample, saved); assert.equal(checks.scenes,15); assert.equal(checks.wordCount,3055);
  assert.equal(checks.coveredBeats.length,15);
  assert.equal(S.fountain(sample,saved), fs.readFileSync(path.join(root,'episodes/consequence/episode.fountain'),'utf8'));
  const audit = S.audit(sample,saved); assert.equal(audit.scenes.length,15); assert.equal(audit.scenes[10].evidence[0].metrics.record,0);
});

test('validator rejects invented sources, wrong runs, incomplete acts and missing events', () => {
  let s=copy(sample);s.run_id='unrelated';assert.throws(()=>S.validate(s,saved),/different simulation/);
  s=copy(sample);s.scenes[0].beat_ids=['invented'];assert.throws(()=>S.validate(s,saved),/Unknown beat/);
  s=copy(sample);s.scenes[2].beat_ids=['B02'];assert.throws(()=>S.validate(s,saved),/Unreferenced intervention/);
  s=copy(sample);s.scenes.pop();assert.throws(()=>S.validate(s,saved),/Missing act/);
  s=copy(sample);s.scenes[0].act='TAG';assert.throws(()=>S.validate(s,saved),/screenplay order/);
  s=copy(sample);s.scenes[0].heading='not a scene';assert.throws(()=>S.validate(s,saved),/INT/);
  s=copy(sample);s.scenes[0].fountain='';assert.throws(()=>S.validate(s,saved),/scene body/);
  s=copy(sample);s.shellCommand='anything';assert.throws(()=>S.validate(s,saved),/script fields/);
});

test('validator rejects first mentions of interventions in reverse order', () => {
  const s=copy(sample);s.scenes[2].beat_ids=['B05'];s.scenes[4].beat_ids=['B03'];
  assert.throws(()=>S.validate(s,saved),/simulation order/);
});

test('HTML reader escapes model-authored text instead of executing markup', () => {
  const s=copy(sample);s.title='<img src=x onerror=alert(1)>';s.scenes[0].fountain='<script>alert(1)</script>';
  const html=reader(s,saved,{method:'<test>',liveApiCall:false});
  assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;script&gt;'));assert.ok(html.includes('&lt;test&gt;'));
});

test('offline browser sample has the same script and measurements as canonical files', () => {
  const context={window:{}};vm.runInNewContext(fs.readFileSync(path.join(root,'assets/demo-episode.js'),'utf8'),context);
  const bundled=JSON.parse(JSON.stringify(context.window.EFMWEpisodeSample));
  assert.deepEqual(bundled.script,sample);assert.deepEqual(bundled.dossier,saved);
  assert.equal(bundled.provenance.liveApiCall,false);
});

test('API adapter sends one structured Responses request and records provider provenance', async () => {
  let calls=0;
  const result=await generateEpisode(saved,{...apiOptions,fetchImpl:async(url,init)=>{
    calls++;assert.equal(url,ENDPOINT);assert.equal(init.headers.Authorization,'Bearer '+apiOptions.apiKey);
    const body=JSON.parse(init.body);assert.equal(body.store,false);assert.equal(body.model,'test-model');
    assert.equal(body.text.format.type,'json_schema');assert.equal(body.text.format.strict,true);
    assert.deepEqual(body.text.format.schema,S.scriptSchema);assert.ok(body.input.includes(saved.runId));
    assert.ok(!body.input.includes(apiOptions.apiKey));return response();
  }});
  assert.equal(calls,1);assert.deepEqual(result.script,sample);assert.equal(result.provenance.liveApiCall,true);assert.equal(result.provenance.responseId,'mock-id');
});

test('API rejects refusals, incomplete output, invalid JSON and wrong-run scripts', async () => {
  const cases=[
    [response(sample,{status:'incomplete'}),/not completed/],
    [response(sample,{output:[{type:'message',content:[{type:'refusal',refusal:'no'}]}]}),/declined/],
    [response(sample,{output:[{type:'message',content:[{type:'output_text',text:'{broken'}]}]}),/invalid episode JSON/],
    [response({...sample,run_id:'wrong'}),/different simulation/],
    [{ok:true,json:async()=>{throw new Error('broken');}},/non-JSON/]
  ];
  for(const [mock,pattern] of cases) await assert.rejects(generateEpisode(saved,{...apiOptions,fetchImpl:async()=>mock}),pattern);
});

test('API failures do not retry and never echo a response body or credentials', async () => {
  let calls=0;
  await assert.rejects(generateEpisode(saved,{...apiOptions,fetchImpl:async()=>{calls++;return {ok:false,status:429,json:async()=>({secret:apiOptions.apiKey})};}}),/HTTP 429/);
  assert.equal(calls,1);
  const err=new Error(apiOptions.apiKey);err.name='TimeoutError';
  await assert.rejects(generateEpisode(saved,{...apiOptions,fetchImpl:async()=>{throw err;}}),e=>e.message.includes('timed out')&&!e.message.includes(apiOptions.apiKey));
  await assert.rejects(generateEpisode(saved,{...apiOptions,maxTokens:0,fetchImpl:async()=>assert.fail('must not call')}),/maxTokens/);
});

test('CLI executes a full offline episode export and clears stale scripts for a new prompt', t => {
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'efmw-story-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
  const cli=path.join(root,'scripts/episode.js');
  execFileSync(process.execPath,[cli,'--provider','demo','--out',out],{cwd:root});
  for(const file of ['episode.html','episode.fountain','script.json','audit.json','provenance.json','run.json','dossier.json']) assert.ok(fs.existsSync(path.join(out,file)),file);
  const provenance=JSON.parse(fs.readFileSync(path.join(out,'provenance.json')));
  assert.equal(provenance.liveApiCall,false);assert.match(provenance.sourceSha256,/^[a-f0-9]{64}$/);
  execFileSync(process.execPath,[cli,'--lab','portal','--out',out],{cwd:root});
  assert.ok(!fs.existsSync(path.join(out,'episode.html')));assert.ok(!fs.existsSync(path.join(out,'script.json')));
  assert.equal(JSON.parse(fs.readFileSync(path.join(out,'dossier.json'))).lab,'portal');
});

test('CLI imports and validates scripts, rejects invalid options, and fails clearly without a key', t => {
  const out=fs.mkdtempSync(path.join(os.tmpdir(),'efmw-import-'));t.after(()=>fs.rmSync(out,{recursive:true,force:true}));
  const cli=path.join(root,'scripts/episode.js');
  execFileSync(process.execPath,[cli,'--script',path.join(root,'episodes/consequence/script.json'),'--out',out],{cwd:root});
  assert.equal(JSON.parse(fs.readFileSync(path.join(out,'provenance.json'))).method,'user-imported');
  let result=spawnSync(process.execPath,[cli,'--provider','openai','--out',out],{cwd:root,env:{...process.env,OPENAI_API_KEY:'',OPENAI_MODEL:''},encoding:'utf8'});
  assert.notEqual(result.status,0);assert.match(result.stderr,/OPENAI_API_KEY/);assert.ok(!fs.existsSync(path.join(out,'episode.fountain')));
  for(const args of [['--provider','unknown'],['--duration','4'],['--provider','demo','--lab','portal'],['--lab','portal','--duration','NaN'],['--oops']]) {
    result=spawnSync(process.execPath,[cli,...args,'--out',out],{cwd:root,encoding:'utf8'});assert.notEqual(result.status,0);
  }
});
