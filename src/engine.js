(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./series.js'));
  else root.EFMW = factory(root.EFMWSeries);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (SERIES) {
  'use strict';
  const VERSION = '1.0.0';
  const MAX_STEPS = 20000;
  const DEFAULTS = {
    lab: 'portal', dt: 0.025, coupling: 0.8, detuning: 1, memoryBias: 0,
    dephasing: 0, curveLocked: false, scripted: true, recordEnabled: true,
    fieldEnabled: false, sourceGain: 0, feedbackGain: 0, damping: 0,
    waveSpeed: 1, gridPoints: 128, domainLength: 24
  };
  const LIMITS = {
    dt: [0.0025, 0.05], coupling: [0, 2], detuning: [0, 3], memoryBias: [0, 3],
    dephasing: [0, 2], sourceGain: [0, 2], feedbackGain: [0, 3], damping: [0, 0.5],
    waveSpeed: [0.25, 2], gridPoints: [32, 512], domainLength: [12, 48]
  };
  const BOOLS = ['curveLocked', 'scripted', 'recordEnabled', 'fieldEnabled'];
  function labById(id) {
    const lab = SERIES.find(x => x.id === id);
    if (!lab) throw new Error('Unknown experiment: ' + id);
    return lab;
  }
  function validatedConfig(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Configuration must be an object.');
    const lab = labById(input.lab || 'portal');
    for (const key of Object.keys(input)) if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) throw new Error('Unknown setting: ' + key);
    const c = Object.assign({}, DEFAULTS, lab.config, input, { lab: lab.id });
    for (const [key, bounds] of Object.entries(LIMITS)) {
      if (!Number.isFinite(c[key]) || c[key] < bounds[0] || c[key] > bounds[1]) throw new Error('Out-of-range setting: ' + key);
    }
    if (!Number.isInteger(c.gridPoints)) throw new Error('gridPoints must be an integer.');
    for (const key of BOOLS) if (typeof c[key] !== 'boolean') throw new Error(key + ' must be boolean.');
    if (c.waveSpeed * c.dt / (c.domainLength / c.gridPoints) > 0.9) throw new Error('Wave grid violates c·dt/dx ≤ 0.9. Reduce dt or gridPoints.');
    return c;
  }
  const copy = x => JSON.parse(JSON.stringify(x));
  function matrix(n) { return { n, re: new Float64Array(n * n), im: new Float64Array(n * n) }; }
  function pureState(re, im) {
    const n = re.length, rho = matrix(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      rho.re[i * n + j] = re[i] * re[j] + im[i] * im[j];
      rho.im[i * n + j] = im[i] * re[j] - re[i] * im[j];
    }
    return rho;
  }
  // Cyclic largest-off-diagonal Jacobi diagonalization of a real symmetric matrix.
  // Eigenvectors are columns. No hidden norm correction is applied anywhere.
  function symmetricEigen(input, n) {
    const a = Float64Array.from(input), v = new Float64Array(n * n);
    for (let i = 0; i < n; i++) v[i * n + i] = 1;
    for (let iter = 0; iter < 100 * n * n; iter++) {
      let p = 0, q = 1, biggest = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
        const z = Math.abs(a[i * n + j]);
        if (z > biggest) { biggest = z; p = i; q = j; }
      }
      if (biggest < 1e-13) return { values: Float64Array.from({ length: n }, (_, i) => a[i * n + i]), vectors: v };
      const ap = a[p * n + p], aq = a[q * n + q], b = a[p * n + q];
      const theta = 0.5 * Math.atan2(2 * b, aq - ap), c = Math.cos(theta), s = Math.sin(theta);
      for (let k = 0; k < n; k++) if (k !== p && k !== q) {
        const kp = a[k * n + p], kq = a[k * n + q];
        a[k * n + p] = a[p * n + k] = c * kp - s * kq;
        a[k * n + q] = a[q * n + k] = s * kp + c * kq;
      }
      a[p * n + p] = c * c * ap - 2 * s * c * b + s * s * aq;
      a[q * n + q] = s * s * ap + 2 * s * c * b + c * c * aq;
      a[p * n + q] = a[q * n + p] = 0;
      for (let k = 0; k < n; k++) {
        const vp = v[k * n + p], vq = v[k * n + q];
        v[k * n + p] = c * vp - s * vq;
        v[k * n + q] = s * vp + c * vq;
      }
    }
    throw new Error('Eigensolver did not converge.');
  }
  function propagator(h, n, dt) {
    const e = symmetricEigen(h, n), u = matrix(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const vv = e.vectors[i * n + k] * e.vectors[j * n + k];
      u.re[i * n + j] += vv * Math.cos(e.values[k] * dt);
      u.im[i * n + j] -= vv * Math.sin(e.values[k] * dt);
    }
    return u;
  }
  function conjugate(rho, u) {
    const n = rho.n, tmp = matrix(n), out = matrix(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const a = i * n + k, b = k * n + j, z = i * n + j;
      tmp.re[z] += u.re[a] * rho.re[b] - u.im[a] * rho.im[b];
      tmp.im[z] += u.re[a] * rho.im[b] + u.im[a] * rho.re[b];
    }
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) for (let k = 0; k < n; k++) {
      const a = i * n + k, b = j * n + k, z = i * n + j;
      out.re[z] += tmp.re[a] * u.re[b] + tmp.im[a] * u.im[b];
      out.im[z] += tmp.im[a] * u.re[b] - tmp.re[a] * u.im[b];
    }
    return out;
  }
  function dephase(rho, strength) {
    const n = rho.n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if ((i >> 1) !== (j >> 1)) {
      rho.re[i * n + j] *= strength; rho.im[i * n + j] *= strength;
    }
  }
  function permute(rho, mapping) {
    const n = rho.n, next = matrix(n);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      next.re[mapping[i] * n + mapping[j]] = rho.re[i * n + j];
      next.im[mapping[i] * n + mapping[j]] = rho.im[i * n + j];
    }
    return next;
  }
  function reducedWorld(rho) {
    const w = rho.n / 2, out = matrix(w);
    for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) for (let m = 0; m < 2; m++) {
      const src = (a * 2 + m) * rho.n + b * 2 + m;
      out.re[a * w + b] += rho.re[src]; out.im[a * w + b] += rho.im[src];
    }
    return out;
  }
  function eraseRecord(rho) {
    const r = reducedWorld(rho), out = matrix(rho.n);
    for (let a = 0; a < r.n; a++) for (let b = 0; b < r.n; b++) {
      out.re[(2 * a) * rho.n + 2 * b] = r.re[a * r.n + b];
      out.im[(2 * a) * rho.n + 2 * b] = r.im[a * r.n + b];
    }
    return out;
  }
  class WaveField {
    constructor(c) {
      this.n = c.gridPoints; this.length = c.domainLength; this.dx = this.length / this.n;
      this.phi = new Float64Array(this.n); this.velocity = new Float64Array(this.n);
    }
    sample(x) {
      const q = ((x / this.dx) % this.n + this.n) % this.n, i = Math.floor(q), f = q - i;
      return (1 - f) * this.phi[i] + f * this.phi[(i + 1) % this.n];
    }
    acceleration(c, source) {
      const out = new Float64Array(this.n), k = c.waveSpeed ** 2 / this.dx ** 2;
      for (let i = 0; i < this.n; i++) out[i] = k * (this.phi[(i + 1) % this.n] - 2 * this.phi[i] + this.phi[(i + this.n - 1) % this.n]) - source[i];
      return out;
    }
    advance(c, source0, source1) {
      const dt = c.dt, decay = Math.exp(-c.damping * dt), a0 = this.acceleration(c, source0);
      for (let i = 0; i < this.n; i++) {
        this.velocity[i] = decay * this.velocity[i] + dt / 2 * a0[i];
        this.phi[i] += dt * this.velocity[i];
      }
      const a1 = this.acceleration(c, source1);
      for (let i = 0; i < this.n; i++) this.velocity[i] = (this.velocity[i] + dt / 2 * a1[i]) * decay;
    }
    energy(c) {
      let e = 0;
      for (let i = 0; i < this.n; i++) e += this.velocity[i] ** 2 + c.waveSpeed ** 2 * ((this.phi[(i + 1) % this.n] - this.phi[i]) / this.dx) ** 2;
      return 0.5 * this.dx * e;
    }
  }
  class Simulation {
    constructor(input = {}) {
      this.config = validatedConfig(input); this.initial = copy(this.config);
      this.lab = labById(this.config.lab); this.worlds = this.lab.worlds; this.n = this.worlds * 2;
      this.steps = 0; this.events = []; this.log = []; this.history = []; this.cachedU = null;
      const re = new Float64Array(this.n), im = new Float64Array(this.n);
      if (this.lab.initial === 'uniform') for (let a = 0; a < this.worlds; a++) re[2 * a] = 1 / Math.sqrt(this.worlds);
      else re[0] = 1;
      this.rho = pureState(re, im); this.field = new WaveField(this.config);
      this.positions = Array.from({ length: this.worlds }, (_, a) => (a + 0.5) * this.config.domainLength / this.worlds);
      this.kernel = this.positions.map(x => Float64Array.from({ length: this.field.n }, (_, i) => {
        const dist = Math.abs(i * this.field.dx - x), d = Math.min(dist, this.field.length - dist);
        return Math.exp(-0.5 * (d / 0.65) ** 2);
      }));
      this.capture();
    }
    get time() { return this.steps * this.config.dt; }
    populations() {
      return Array.from({ length: this.worlds }, (_, a) => this.rho.re[(2 * a) * this.n + 2 * a] + this.rho.re[(2 * a + 1) * this.n + 2 * a + 1]);
    }
    activeEdge(a, b) { return !this.config.curveLocked || (a < this.lab.boundary) === (b < this.lab.boundary); }
    hamiltonian() {
      const h = new Float64Array(this.n * this.n), c = this.config;
      for (let a = 0; a < this.worlds; a++) for (let m = 0; m < 2; m++) {
        const i = 2 * a + m, bias = Math.cos(2 * Math.PI * a / this.worlds);
        h[i * this.n + i] = c.detuning * this.lab.energies[a] + c.memoryBias * m * bias + (c.fieldEnabled ? c.feedbackGain * this.field.sample(this.positions[a]) : 0);
      }
      for (const [a, b] of this.lab.edges) if (this.activeEdge(a, b)) for (let m = 0; m < 2; m++) {
        const i = 2 * a + m, j = 2 * b + m; h[i * this.n + j] = h[j * this.n + i] = c.coupling;
      }
      return h;
    }
    source(time, populations) {
      const s = new Float64Array(this.field.n), c = this.config;
      if (this.lab.id === 'feedback') {
        for (let a = 0; a < this.worlds; a++) for (let i = 0; i < s.length; i++) s[i] += c.sourceGain * populations[a] * this.kernel[a][i];
      } else if (time >= 0 && time <= 3) {
        const strength = c.sourceGain * Math.sin(Math.PI * time / 3) ** 2;
        for (let i = 0; i < s.length; i++) s[i] = strength * this.kernel[0][i];
      }
      return s;
    }
    action(action, remember = true) {
      if (!action || typeof action !== 'object') throw new Error('Invalid action.');
      if (remember && this.events.length >= 2000) throw new Error('Run has reached the 2,000-intervention limit.');
      const validWorld = a => Number.isInteger(a) && a >= 0 && a < this.worlds;
      let message = '';
      if (action.type === 'parameters') {
        if (!action.values || typeof action.values !== 'object' || Array.isArray(action.values)) throw new Error('Missing parameter values.');
        for (const key of Object.keys(action.values)) if (!([...Object.keys(LIMITS), ...BOOLS].includes(key)) || ['dt', 'gridPoints', 'domainLength', 'fieldEnabled'].includes(key)) throw new Error('Setting cannot change during a run: ' + key);
        this.config = validatedConfig(Object.assign({}, this.config, action.values)); this.cachedU = null;
        message = Object.entries(action.values).map(([k, v]) => k + ' = ' + v).join(', ');
      } else if (action.type === 'record') {
        if (!validWorld(action.world)) throw new Error('Invalid record world.');
        if (this.config.recordEnabled) {
          this.rho = permute(this.rho, Array.from({ length: this.n }, (_, i) => (i >> 1) === action.world ? i ^ 1 : i));
          message = 'Record bit toggled in world ' + action.world;
        } else message = 'Record gate disabled by ablation';
      } else if (action.type === 'swap') {
        if (!validWorld(action.a) || !validWorld(action.b) || action.a === action.b) throw new Error('Choose two distinct valid worlds.');
        this.rho = permute(this.rho, Array.from({ length: this.n }, (_, i) => {
          const a = i >> 1, b = a === action.a ? action.b : a === action.b ? action.a : a; return 2 * b + (i % 2);
        })); message = 'Swapped worlds ' + action.a + ' and ' + action.b + '; record preserved';
      } else if (action.type === 'erase') {
        this.rho = eraseRecord(this.rho); message = 'Record discarded; reduced-world state retained';
      } else throw new Error('Unknown action type.');
      if (remember) {
        this.events.push({ step: this.steps, action: copy(action) });
      }
      this.log.push({ time: this.time, message, automatic: !remember });
      this.capture();
    }
    step(count = 1) {
      if (!Number.isInteger(count) || count < 1 || this.steps + count > MAX_STEPS) throw new Error('Step limit: ' + MAX_STEPS + '. Reset to start another run.');
      for (let z = 0; z < count; z++) {
        const c = this.config;
        if (c.scripted) for (const event of this.lab.schedule) if (Math.round(event.time / c.dt) === this.steps) this.action(event.action, false);
        const oldP = this.populations(), cfg = this.config;
        if (!this.cachedU || (cfg.fieldEnabled && cfg.feedbackGain !== 0)) this.cachedU = propagator(this.hamiltonian(), this.n, cfg.dt);
        dephase(this.rho, Math.exp(-cfg.dephasing * cfg.dt / 2));
        this.rho = conjugate(this.rho, this.cachedU);
        dephase(this.rho, Math.exp(-cfg.dephasing * cfg.dt / 2));
        if (cfg.fieldEnabled) this.field.advance(cfg, this.source(this.time, oldP), this.source(this.time + cfg.dt, oldP));
        this.steps++;
        if (this.steps % 10 === 0) this.capture();
      }
      return this;
    }
    metrics() {
      const w = reducedWorld(this.rho), p = this.populations();
      let trace = 0, purity = 0, worldPurity = 0, coherence = 0, record = 0, mutualInformation = 0;
      for (let i = 0; i < this.n; i++) {
        trace += this.rho.re[i * this.n + i];
        if (i % 2) record += this.rho.re[i * this.n + i];
      }
      for (let i = 0; i < this.n ** 2; i++) purity += this.rho.re[i] ** 2 + this.rho.im[i] ** 2;
      for (let a = 0; a < this.worlds; a++) for (let b = 0; b < this.worlds; b++) {
        const i = a * this.worlds + b;
        worldPurity += w.re[i] ** 2 + w.im[i] ** 2;
        if (a !== b) coherence += Math.hypot(w.re[i], w.im[i]);
      }
      for (let a = 0; a < this.worlds; a++) for (let m = 0; m < 2; m++) {
        const j = 2 * a + m, joint = this.rho.re[j * this.n + j], denom = p[a] * (m ? record : trace - record);
        if (joint > 1e-15 && denom > 1e-15) mutualInformation += joint * Math.log2(joint / denom);
      }
      return { time: this.time, trace, traceError: Math.abs(trace - 1), purity, worldPurity,
        coherence: coherence / (this.worlds - 1), record, mutualInformation,
        outside: p.slice(this.lab.boundary).reduce((a, b) => a + b, 0),
        fieldEnergy: this.field.energy(this.config), fieldAmplitude: Math.max(...this.field.phi.map(Math.abs)), populations: p };
    }
    capture() {
      const m = this.metrics(), last = this.history[this.history.length - 1];
      if (last && last.time === m.time) this.history[this.history.length - 1] = m; else this.history.push(m);
    }
    exportRecord() {
      return { schema: 'efmw-multiverse-run/v1', engine: VERSION, initial: copy(this.initial), steps: this.steps, interventions: copy(this.events), result: this.metrics() };
    }
    csv() {
      const history = this.history.slice(), m = this.metrics();
      if (!history.length || history[history.length - 1].time !== m.time) history.push(m);
      const fields = ['time', 'trace', 'traceError', 'purity', 'worldPurity', 'coherence', 'record', 'mutualInformation', 'outside', 'fieldEnergy', 'fieldAmplitude'];
      return [fields.concat(m.populations.map((_, i) => 'world_' + i)).join(','), ...history.map(r => fields.map(f => r[f]).concat(r.populations).join(','))].join('\n') + '\n';
    }
  }
  function replay(record) {
    if (!record || record.schema !== 'efmw-multiverse-run/v1' || record.engine !== VERSION) throw new Error('Unsupported run schema or engine version.');
    if (!Number.isInteger(record.steps) || record.steps < 0 || record.steps > MAX_STEPS) throw new Error('Invalid replay length.');
    if (!Array.isArray(record.interventions) || record.interventions.length > 2000) throw new Error('Invalid interventions.');
    let previous = -1;
    for (const e of record.interventions) {
      if (!Number.isInteger(e.step) || e.step < 0 || e.step < previous || e.step > record.steps) throw new Error('Interventions must be ordered and within the run.'); previous = e.step;
    }
    const sim = new Simulation(record.initial); let k = 0;
    while (sim.steps <= record.steps) {
      while (k < record.interventions.length && record.interventions[k].step === sim.steps) sim.action(record.interventions[k++].action);
      if (sim.steps === record.steps) break;
      sim.step();
    }
    return sim;
  }
  function compare(config, duration = 8) {
    if (!Number.isFinite(duration) || duration <= 0 || duration > 30) throw new Error('Comparison duration must be in (0, 30].');
    const lab = labById(config.lab), enabled = new Simulation(config), baseline = new Simulation(Object.assign({}, config, lab.ablation.patch));
    const steps = Math.round(duration / enabled.config.dt);
    enabled.step(steps); baseline.step(steps);
    return { lab: lab.id, name: lab.ablation.name, duration: enabled.time, enabled: enabled.metrics(), baseline: baseline.metrics(),
      totalVariation: enabled.populations().reduce((sum, p, i) => sum + Math.abs(p - baseline.populations()[i]), 0) / 2 };
  }
  return { VERSION, MAX_STEPS, SERIES, DEFAULTS, LIMITS, labById, validatedConfig, matrix, pureState, symmetricEigen, propagator, conjugate, reducedWorld, dephase, eraseRecord, WaveField, Simulation, replay, compare };
});
