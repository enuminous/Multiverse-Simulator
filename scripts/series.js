#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const E = require('../src/engine.js');
const args = process.argv.slice(2);
if (args.length > 1) { console.error('Usage: node scripts/series.js [output-directory]'); process.exit(1); }
const out = path.resolve(args[0] || 'results'); fs.mkdirSync(out, { recursive: true });
const results = [];
for (const lab of E.SERIES) {
  const sim = new E.Simulation({ lab: lab.id }); sim.step(320);
  fs.writeFileSync(path.join(out, lab.id + '-run.json'), JSON.stringify(sim.exportRecord(), null, 2) + '\n');
  fs.writeFileSync(path.join(out, lab.id + '-data.csv'), sim.csv());
  const comparison = E.compare({ lab: lab.id }); results.push(comparison);
  console.log(lab.number + ' ' + lab.title + ': trace error ' + sim.metrics().traceError.toExponential(2));
}
fs.writeFileSync(path.join(out, 'comparisons.json'), JSON.stringify({ engine: E.VERSION, results }, null, 2) + '\n');
console.log('Saved six replay files, six CSVs, and comparisons to ' + out);
