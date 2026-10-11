'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), os = require('node:os'), path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..'), cli = path.join(root, 'scripts/simulate.js');
function run(args) { return spawnSync(process.execPath, [cli, ...args], { cwd: root, encoding: 'utf8' }); }
test('CLI exports usable JSON and CSV and replays the saved state', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'efmw-cli-'));
  try {
    const out = path.join(dir, 'run'), first = run(['--lab', 'memory', '--steps', '213', '--out', out]);
    assert.equal(first.status, 0, first.stderr); assert.ok(fs.existsSync(out + '.csv'));
    const second = run(['--replay', out + '.json']); assert.equal(second.status, 0, second.stderr);
    assert.deepEqual(JSON.parse(second.stdout).metrics, JSON.parse(first.stdout).metrics);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
test('CLI accepts exact zero steps and boolean parameter overrides', () => {
  const r = run(['--lab', 'curve', '--steps', '0', '--set', 'scripted=false']); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).steps, 0);
});
test('CLI fails clearly for invalid, ambiguous, or unsafe-size runs', () => {
  for (const args of [['--lab', 'invalid'], ['--steps', '-3'], ['--steps', '1', '--duration', '2'], ['--set', 'coupling=abc'], ['--steps', '999999'], ['--unknown'], ['--set', 'lab=curve']]) {
    const result = run(args); assert.equal(result.status, 1, args.join(' ')); assert.match(result.stderr, /Error:/);
  }
});
test('Batch command creates six independent run bundles and comparisons', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'efmw-series-'));
  try {
    const r = spawnSync(process.execPath, [path.join(root, 'scripts/series.js'), dir], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr);
    assert.equal(fs.readdirSync(dir).length, 13); const report = JSON.parse(fs.readFileSync(path.join(dir, 'comparisons.json'))); assert.equal(report.results.length, 6);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
