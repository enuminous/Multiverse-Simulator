#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const E = require('../src/engine.js');
const HELP = `EFMW Multiverse Simulator ${E.VERSION}

node scripts/simulate.js --lab portal --duration 8 --out results/portal
node scripts/simulate.js --lab feedback --steps 320 --set feedbackGain=0.5
node scripts/simulate.js --replay examples/memory-run.json --out results/replay

Options:
  --lab ID         portal | curve | memory | decoherence | field | feedback
  --duration N     Run for N normalized time units (default 8; rounded to dt).
  --steps N        Exact step count, instead of duration (0 to ${E.MAX_STEPS}).
  --set KEY=VALUE  Override initial configuration; may be repeated.
  --replay FILE    Reconstruct a browser or CLI run; cannot mix with overrides.
  --out PREFIX     Write PREFIX.json and PREFIX.csv; existing files are replaced.
  --help           Show this help.

No network requests, external packages, randomness, or hidden renormalization.`;
function main(args) {
  const options = {}, changes = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i]; if (key === '--help') { console.log(HELP); return; }
    if (!['--lab', '--duration', '--steps', '--set', '--out', '--replay'].includes(key) || args[i + 1] === undefined) throw new Error('Unknown or incomplete option: ' + key);
    const value = args[++i];
    if (key === '--set') {
      const match = /^([A-Za-z]+)=(.+)$/.exec(value); if (!match) throw new Error('Use --set key=value.');
      if (match[1] === 'lab') throw new Error('Use --lab to select an experiment.');
      changes[match[1]] = match[2] === 'true' ? true : match[2] === 'false' ? false : Number(match[2]);
    } else { if (Object.prototype.hasOwnProperty.call(options, key)) throw new Error('Repeated option: ' + key); options[key] = value; }
  }
  if (options['--duration'] !== undefined && options['--steps'] !== undefined) throw new Error('Choose duration or steps, not both.');
  let sim;
  if (options['--replay']) {
    if (Object.keys(changes).length || options['--lab'] || options['--duration'] !== undefined || options['--steps'] !== undefined) throw new Error('Replay cannot be combined with initial-condition overrides.');
    const stat = fs.statSync(options['--replay']); if (stat.size > 5 * 1024 * 1024) throw new Error('Run file exceeds 5 MiB.');
    sim = E.replay(JSON.parse(fs.readFileSync(options['--replay'], 'utf8')));
  } else {
    sim = new E.Simulation(Object.assign({ lab: options['--lab'] || 'portal' }, changes));
    const duration = options['--duration'] === undefined ? 8 : Number(options['--duration']);
    if (!Number.isFinite(duration) || duration < 0) throw new Error('Duration must be finite and nonnegative.');
    const steps = options['--steps'] === undefined ? Math.round(duration / sim.config.dt) : Number(options['--steps']);
    if (!Number.isInteger(steps) || steps < 0 || steps > E.MAX_STEPS) throw new Error('Invalid step count.');
    if (steps) sim.step(steps);
  }
  const record = sim.exportRecord();
  if (options['--out']) {
    const prefix = path.resolve(options['--out']); fs.mkdirSync(path.dirname(prefix), { recursive: true });
    fs.writeFileSync(prefix + '.json', JSON.stringify(record, null, 2) + '\n'); fs.writeFileSync(prefix + '.csv', sim.csv());
  }
  console.log(JSON.stringify({ engine: E.VERSION, lab: sim.lab.id, steps: sim.steps, metrics: record.result }, null, 2));
}
try { main(process.argv.slice(2)); } catch (e) { console.error('Error: ' + e.message); process.exitCode = 1; }
