#!/usr/bin/env node
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const E = require('../src/engine.js'), Story = require('../src/story.js');
const { generateEpisode } = require('../src/llm.js');
const root = path.resolve(__dirname, '..');
function readJSON(file) { if (fs.statSync(file).size > 5 * 1024 * 1024) throw new Error('Input must be under 5 MiB.'); return JSON.parse(fs.readFileSync(file, 'utf8')); }
const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
function reader(script, d, provenance) {
  const text = Story.fountain(script, d), checks = Story.validate(script, d);
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + escapeHTML(script.title) + '</title><style>body{margin:0;background:#101920;color:#e5ecdf;font:17px system-ui}main{max-width:800px;margin:auto;padding:52px 28px}h1{font-size:44px;letter-spacing:-2px}p{line-height:1.6}a{color:#b6ef76}pre{background:#fffdf6;color:#19212a;padding:48px;white-space:pre-wrap;overflow-wrap:anywhere;font:15px/1.6 ui-monospace,monospace}small{color:#adbdbb}@media(max-width:550px){main{padding:24px 12px}pre{padding:24px 18px}}@media print{body{background:white;color:black}main{padding:0}pre{padding:0;font-size:11pt}header{page-break-after:always}}@page{margin:22mm}</style><main><header><small>EFMW PHYSICS · SIMULATION TO SCREENPLAY</small><h1>' + escapeHTML(script.title) + '</h1><p>' + escapeHTML(script.logline) + '</p><p>' + checks.scenes + ' scenes · ' + checks.wordCount + ' screenplay words · ' + escapeHTML(d.runId) + '</p><p>Original, unofficial fan fiction. The numerical run constrains the story; dialogue and character events are inventions.</p><p><small>Generation: ' + escapeHTML(provenance.method) + '. Live API call: ' + (provenance.liveApiCall ? 'yes' : 'no') + '. Browser Print can export this reader to PDF.</small></p></header><pre>' + escapeHTML(text) + '</pre></main></html>\n';
}
function saveBase(out, d, premise) {
  const prompt = Story.prompt(d, premise);
  fs.mkdirSync(out, { recursive: true });
  // Never leave an old episode next to a new run if generation fails or is skipped.
  for (const name of ['script.json', 'episode.fountain', 'episode.html', 'audit.json', 'provenance.json']) fs.rmSync(path.join(out, name), { force: true });
  const put = (name, value) => fs.writeFileSync(path.join(out, name), typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n');
  put('run.json', d.source); put('dossier.json', d); put('prompt.txt', prompt); put('script-schema.json', Story.scriptSchema);
  return put;
}
function saveScript(put, d, script, provenance) {
  const checks = Story.validate(script, d);
  provenance = { ...provenance, engine: E.VERSION, writerVersion: Story.VERSION, runId: d.runId,
    sourceSha256: crypto.createHash('sha256').update(Story.canonical(d.source)).digest('hex'),
    scriptSha256: crypto.createHash('sha256').update(Story.canonical(script)).digest('hex') };
  put('script.json', script); put('episode.fountain', Story.fountain(script, d)); put('episode.html', reader(script, d, provenance));
  put('audit.json', Story.audit(script, d)); put('provenance.json', provenance);
  return checks;
}
async function main(args) {
  const options = { provider: 'manual', out: 'results/episode' };
  const allowed = ['provider', 'out', 'lab', 'replay', 'duration', 'model', 'premise', 'script', 'max-tokens'];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--help') { console.log('Usage: node scripts/episode.js [--provider manual|openai|demo] [--lab portal|curve|memory|decoherence|field|feedback | --replay run.json] [--duration 8] [--model MODEL] [--premise TEXT] [--script script.json] [--max-tokens 16000] [--out results/episode]\nDefault: the 14-unit consequence scenario. manual exports a prompt without a network call; openai generates a script; demo copies the supplied assistant-authored episode. Outputs replace files in --out.'); return; }
    const key = args[i].replace(/^--/, '');
    if (!args[i].startsWith('--') || !allowed.includes(key) || i + 1 >= args.length || args[i + 1].startsWith('--')) throw new Error('Unknown or incomplete argument: ' + args[i]);
    options[key] = args[++i];
  }
  if (!['manual', 'openai', 'demo'].includes(options.provider)) throw new Error('Provider must be manual, openai, or demo.');
  if (options.lab && options.replay) throw new Error('Choose either --lab or --replay.');
  if (options.duration && !options.lab) throw new Error('--duration requires --lab.');
  if (options.script && options.provider !== 'manual') throw new Error('--script is only used with the manual provider.');
  if (options.provider === 'demo' && ['lab','replay','duration','premise','model','max-tokens'].some(k => options[k])) throw new Error('Demo uses the fixed supplied scenario and script. Omit generation options.');
  let sim;
  if (options.replay) sim = E.replay(readJSON(options.replay));
  else if (options.lab) {
    const duration = Number(options.duration ?? 8);
    if (!Number.isFinite(duration) || duration <= 0 || duration > 60) throw new Error('Duration must be in (0, 60].');
    sim = new E.Simulation({ lab: options.lab }); sim.step(Math.max(1, Math.round(duration / sim.config.dt)));
  } else sim = Story.scenario();
  const d = Story.dossier(sim.exportRecord());
  // Read imports before replacing any output files, including an in-place import.
  let generated;
  if (options.provider === 'demo') generated = { script: readJSON(path.join(root, 'episodes/consequence/script.json')), provenance: readJSON(path.join(root, 'episodes/consequence/provenance.json')) };
  else if (options.script) generated = { script: readJSON(options.script), provenance: { method: 'user-imported', model: null, liveApiCall: false, generatedAt: null } };
  if (generated) Story.validate(generated.script, d);
  const put = saveBase(path.resolve(options.out), d, options.premise || '');
  if (options.provider === 'openai') generated = await generateEpisode(d, { model: options.model, premise: options.premise, maxTokens: options['max-tokens'] ? Number(options['max-tokens']) : undefined });
  if (generated) {
    const checks = saveScript(put, d, generated.script, generated.provenance);
    console.log(JSON.stringify({ out: path.resolve(options.out), runId: d.runId, ...checks }, null, 2));
  } else console.log('Simulation complete: ' + d.runId + '. Prompt, schema, replay, and evidence dossier written to ' + options.out + '. No LLM was called.');
}
if (require.main === module) main(process.argv.slice(2)).catch(err => { console.error('Episode error: ' + err.message); process.exitCode = 1; });
module.exports = { main, reader, saveBase, saveScript };
