'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const E = require('../src/engine.js');
function near(a, b, tolerance = 1e-10) { assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b} by ${Math.abs(a - b)}`); }
function maxDiff(a, b) { return Math.max(...Array.from(a, (x, i) => Math.abs(x - b[i]))); }

test('Two-world transfer matches the analytical solution at 41 times', () => {
  const s = new E.Simulation({ lab: 'portal', coupling: 0.7 });
  for (let i = 0; i < 41; i++) { near(s.populations()[1], Math.sin(0.7 * s.time) ** 2); s.step(7); }
});
test('Detuned two-level transfer follows the independent Rabi formula', () => {
  const k = 0.65, delta = 1.3, omega = Math.sqrt(k * k + delta * delta / 4);
  const s = new E.Simulation({ lab: 'portal', coupling: k, detuning: delta });
  for (let i = 0; i < 25; i++) { s.step(11); near(s.populations()[1], k * k / omega ** 2 * Math.sin(omega * s.time) ** 2); }
});
test('No portal coupling means no population transfer', () => {
  const s = new E.Simulation({ lab: 'portal', coupling: 0, detuning: 1.5 }); s.step(600); near(s.populations()[0], 1); near(s.populations()[1], 0);
});
test('Closed curve prevents leakage; opening its links permits transport', () => {
  const s = new E.Simulation({ lab: 'curve', scripted: false }); s.step(320); near(s.metrics().outside, 0, 1e-12);
  s.action({ type: 'parameters', values: { curveLocked: false } }); s.step(120); assert.ok(s.metrics().outside > 0.01);
});
test('A world swap preserves memory marginal, trace, and purity', () => {
  const s = new E.Simulation({ lab: 'memory', scripted: false }); s.step(60); s.action({ type: 'record', world: 1 });
  const before = s.metrics(); assert.ok(before.record > 0.05 && before.record < 0.95);
  s.action({ type: 'swap', a: 1, b: 3 }); const after = s.metrics();
  near(after.record, before.record); near(after.purity, before.purity); near(after.trace, before.trace); near(after.populations[3], before.populations[1]);
});
test('Conditional record creates world-record correlations without loss of global purity', () => {
  const s = new E.Simulation({ lab: 'decoherence', coupling: 0, dephasing: 0, detuning: 0 });
  s.action({ type: 'record', world: 0 }); const m = s.metrics(); near(m.purity, 1); near(m.worldPurity, 0.625); near(m.record, 0.25); assert.ok(m.mutualInformation > 0.8);
});
test('Discarding the record preserves the reduced-world state, not the lost coherence', () => {
  const s = new E.Simulation({ lab: 'decoherence' }); s.action({ type: 'record', world: 0 }); const before = E.reducedWorld(s.rho);
  s.action({ type: 'erase' }); const after = E.reducedWorld(s.rho);
  near(s.metrics().record, 0); assert.ok(maxDiff(before.re, after.re) < 1e-13); assert.ok(maxDiff(before.im, after.im) < 1e-13); near(s.metrics().worldPurity, 0.625);
});
test('Pure dephasing matches exact coherence and purity decay', () => {
  const gamma = 0.37, s = new E.Simulation({ lab: 'decoherence', coupling: 0, detuning: 0, dephasing: gamma }); s.step(240);
  near(s.metrics().coherence, Math.exp(-gamma * s.time)); near(s.metrics().purity, 0.25 + 0.75 * Math.exp(-2 * gamma * s.time));
  for (const p of s.populations()) near(p, 0.25);
});
test('All six presets keep trace, Hermiticity, and finite field values through t=20', () => {
  for (const lab of E.SERIES) {
    const s = new E.Simulation({ lab: lab.id }); s.step(800); const m = s.metrics();
    assert.ok(m.traceError < 1e-9, lab.id); assert.ok(m.purity >= 1 / s.n - 1e-9 && m.purity <= 1 + 1e-9, lab.id);
    for (const p of m.populations) assert.ok(p >= -1e-10 && p <= 1 + 1e-10);
    for (let i = 0; i < s.n; i++) for (let j = 0; j < s.n; j++) { near(s.rho.re[i * s.n + j], s.rho.re[j * s.n + i]); near(s.rho.im[i * s.n + j], -s.rho.im[j * s.n + i]); }
    assert.ok(Number.isFinite(m.fieldEnergy));
  }
});
test('Density matrices remain positive semidefinite (realification eigenvalues)', () => {
  for (const lab of E.SERIES) {
    const s = new E.Simulation({ lab: lab.id }); s.step(317);
    const d = 2 * s.n, real = new Float64Array(d * d);
    for (let i = 0; i < s.n; i++) for (let j = 0; j < s.n; j++) {
      const k = i * s.n + j; real[i * d + j] = s.rho.re[k]; real[i * d + j + s.n] = -s.rho.im[k];
      real[(i + s.n) * d + j] = s.rho.im[k]; real[(i + s.n) * d + j + s.n] = s.rho.re[k];
    }
    assert.ok(Math.min(...E.symmetricEigen(real, d).values) > -1e-10, lab.id);
  }
});
test('Unitary propagation reverses when the time step changes sign', () => {
  const s = new E.Simulation({ lab: 'memory', scripted: false }); const h = s.hamiltonian(), u = E.propagator(h, s.n, 0.12), back = E.propagator(h, s.n, -0.12);
  const restored = E.conjugate(E.conjugate(s.rho, u), back); assert.ok(maxDiff(restored.re, s.rho.re) < 1e-11); assert.ok(maxDiff(restored.im, s.rho.im) < 1e-11);
});
test('Replay reproduces guided and manual events, including edits at the endpoint', () => {
  const s = new E.Simulation({ lab: 'feedback' }); s.step(31); s.action({ type: 'parameters', values: { coupling: 1.1 } });
  s.step(70); s.action({ type: 'swap', a: 0, b: 5 }); s.step(81); s.action({ type: 'erase' });
  const record = JSON.parse(JSON.stringify(s.exportRecord())), r = E.replay(record);
  assert.ok(maxDiff(r.rho.re, s.rho.re) < 1e-13); assert.ok(maxDiff(r.field.phi, s.field.phi) < 1e-13); assert.deepEqual(r.events, s.events); assert.deepEqual(r.log, s.log);
});
test('Replay rejects unsupported schemas, bad order, impossible steps, and malformed actions', () => {
  const s = new E.Simulation(), base = s.exportRecord();
  assert.throws(() => E.replay({ ...base, schema: 'other' })); assert.throws(() => E.replay({ ...base, steps: -1 }));
  assert.throws(() => E.replay({ ...base, interventions: [{ step: -1, action: { type: 'erase' } }] }));
  assert.throws(() => E.replay({ ...base, steps: 10, interventions: [{ step: 5, action: { type: 'erase' } }, { step: 3, action: { type: 'erase' } }] }));
  assert.throws(() => E.replay({ ...base, interventions: [{ step: 0, action: { type: 'swap', a: 0, b: 99 } }] }));
});
test('Validation rejects invalid configuration and unstable wave grids', () => {
  for (const patch of [{ coupling: NaN }, { coupling: -1 }, { dt: 0 }, { gridPoints: 512, dt: 0.05, waveSpeed: 2 }, { madeUp: 1 }, { scripted: 'true' }, JSON.parse('{"__proto__":{}}')]) assert.throws(() => new E.Simulation(patch));
  const s = new E.Simulation(); assert.throws(() => s.action({ type: 'parameters', values: { dt: 0.01 } }));
});
test('No source and zero initial field give the exact zero solution', () => {
  const s = new E.Simulation({ lab: 'field', sourceGain: 0 }); s.step(400); near(s.metrics().fieldEnergy, 0); near(s.metrics().fieldAmplitude, 0);
});
test('Undriven periodic Fourier mode converges quadratically under joint refinement', () => {
  function error(n) {
    const c = E.validatedConfig({ lab: 'field', gridPoints: n, dt: 0.025 * 64 / n, damping: 0, sourceGain: 0 });
    const f = new E.WaveField(c), zero = new Float64Array(n), k = 2 * Math.PI * 3 / c.domainLength, t = 2;
    for (let i = 0; i < n; i++) f.phi[i] = Math.sin(k * i * f.dx);
    for (let s = 0; s < Math.round(t / c.dt); s++) f.advance(c, zero, zero);
    return Math.sqrt(f.phi.reduce((sum, value, i) => sum + (value - Math.sin(k * i * f.dx) * Math.cos(k * c.waveSpeed * t)) ** 2, 0) / n);
  }
  const e1 = error(64), e2 = error(128), e3 = error(256); assert.ok(e1 / e2 > 3.5 && e2 / e3 > 3.5); assert.ok(e3 < 0.002);
});
test('Damping dissipates the energy of an unforced field', () => {
  const c = E.validatedConfig({ lab: 'field', damping: 0.15, sourceGain: 0 }), f = new E.WaveField(c), z = new Float64Array(c.gridPoints);
  for (let i = 0; i < f.n; i++) f.phi[i] = Math.sin(2 * Math.PI * i / f.n); const before = f.energy(c);
  for (let s = 0; s < 500; s++) f.advance(c, z, z);
  assert.ok(f.energy(c) < before * 0.2);
});
test('Zero field feedback leaves the quantum trajectory independent of source amplitude', () => {
  const a = new E.Simulation({ lab: 'feedback', feedbackGain: 0, sourceGain: 0 }), b = new E.Simulation({ lab: 'feedback', feedbackGain: 0, sourceGain: 1.5 }); a.step(320); b.step(320);
  assert.ok(maxDiff(a.rho.re, b.rho.re) < 1e-12); assert.ok(b.metrics().fieldEnergy > 0.01);
});
test('All comparisons execute with finite metrics and the named mechanism removed', () => {
  for (const lab of E.SERIES) { const r = E.compare({ lab: lab.id }); assert.ok(Number.isFinite(r.totalVariation)); near(r.baseline.trace, 1, 1e-9); }
  near(E.compare({ lab: 'curve' }).baseline.outside, 0); near(E.compare({ lab: 'memory' }).baseline.record, 0); near(E.compare({ lab: 'field' }).baseline.fieldEnergy, 0);
});
test('CSV includes the endpoint even when it lies between sampling steps', () => {
  const s = new E.Simulation(); s.step(13); const csv = s.csv().trim().split('\n'); near(Number(csv[csv.length - 1].split(',')[0]), s.time);
  assert.equal(csv[0].split(',').length, csv[csv.length - 1].split(',').length);
});
