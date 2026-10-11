#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..'), dist = path.join(root, 'dist');
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(dist);
for (const file of ['index.html', 'README.md', 'LICENSE.txt', '.nojekyll']) fs.copyFileSync(path.join(root, file), path.join(dist, file));
for (const dir of ['assets', 'src', 'docs', 'examples', 'episodes']) fs.cpSync(path.join(root, dir), path.join(dist, dir), { recursive: true });
console.log('Static application assembled in dist/. No compilation or dependencies required.');
