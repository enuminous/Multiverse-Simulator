#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let checks = 0;
for (const match of html.matchAll(/(?:src|href)="([^"#][^"]*)"/g)) {
  if (/^(https?:|data:)/.test(match[1])) continue;
  const file = path.join(root, match[1].split('#')[0]);
  if (!fs.existsSync(file)) throw new Error('Broken local reference: ' + match[1]); checks++;
}
const ids = Array.from(html.matchAll(/\bid="([^"]+)"/g), m => m[1]);
if (new Set(ids).size !== ids.length) throw new Error('Duplicate HTML IDs.');
for (const controller of ['assets/app.js', 'assets/writer.js']) {
  const app = fs.readFileSync(path.join(root, controller), 'utf8');
  for (const m of app.matchAll(/\$\('([^']+)'\)/g)) {
    if (!ids.includes(m[1])) throw new Error('Controller references absent element: ' + m[1]); checks++;
  }
}
function visit(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, entry.name);
    if (entry.isDirectory() && !['dist', 'node_modules', '.git', 'results'].includes(entry.name)) visit(f);
    else if (entry.isFile() && f.endsWith('.js')) { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); checks++; }
  }
}
visit(root);
for (const name of ['EQUATIONS', 'EXPERIMENTS', 'CLAIMS', 'VALIDATION', 'SOURCES', 'GITHUB', 'EPISODE-WRITER']) if (!fs.existsSync(path.join(root, 'docs', name + '.md'))) throw new Error('Missing documentation: ' + name);
console.log(checks + ' static checks passed: local references, DOM IDs, and JavaScript syntax.');
