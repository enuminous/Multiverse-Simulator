/* Browser controller. Engine and experiment definitions are also used by the CLI. */
(function () {
  'use strict';
  const E = window.EFMW, $ = id => document.getElementById(id);
  const colors = { lime: '#b6ef76', coral: '#ef9b88', blue: '#7ac5dc', line: '#263643', muted: '#9badbb' };
  const controlInfo = {
    coupling: ['Portal strength κ', 'Symmetric world-to-world coupling', 0, 2, 0.05],
    detuning: ['Energy contrast', 'Scales the preset world energies', 0, 3, 0.05],
    memoryBias: ['Record bias η', 'Energy shift when the bit is 1', 0, 3, 0.05],
    dephasing: ['Dephasing γ', 'Loss of coherence between worlds', 0, 2, 0.025],
    sourceGain: ['Source amplitude A', 'Strength of the normalized forcing', 0, 2, 0.05],
    damping: ['Field damping ζ', 'Attenuation rate for field velocity', 0, 0.5, 0.01],
    waveSpeed: ['Wave speed c', 'Propagation speed in normalized units', 0.25, 2, 0.05],
    feedbackGain: ['Return coupling g', 'Field amplitude → world energy', 0, 3, 0.05]
  };
  let sim, running = false, lastFrame = 0, noticeTimer, comparisonToken = 0;
  let fieldRows = [], lastFieldStep = -1, lastLogCount = -1;
  function notice(message, error = false) {
    $('notice').textContent = message; $('notice').classList.toggle('error', error); $('notice').hidden = false;
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { $('notice').hidden = true; }, error ? 9000 : 4500);
  }
  function safe(fn) { try { return fn(); } catch (e) { setRunning(false); notice(e.message, true); } }
  function setRunning(value) {
    running = value; $('play').textContent = value ? 'Ⅱ Pause' : '▶ Run experiment';
    $('runningStatus').textContent = value ? 'RUNNING' : 'PAUSED';
    $('runningStatus').classList.toggle('running', value);
    $('play').setAttribute('aria-pressed', String(value));
  }
  function setupNav() {
    for (const lab of E.SERIES) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'nav-button';
      button.dataset.lab = lab.id;
      for (const [className, text] of [['nav-num', lab.number], ['nav-text', lab.title], ['nav-arrow', '↗']]) {
        const span = document.createElement('span'); span.className = className; span.textContent = text; button.appendChild(span);
      }
      button.addEventListener('click', () => selectLab(lab.id)); $('seriesNav').appendChild(button);
    }
  }
  function buildControls() {
    $('sliders').replaceChildren();
    for (const key of sim.lab.controls) {
      const [name, hint, min, max, step] = controlInfo[key], wrap = document.createElement('div'); wrap.className = 'slider-control';
      const top = document.createElement('div'); top.className = 'slider-top';
      const label = document.createElement('label'); label.htmlFor = 'control-' + key; label.textContent = name;
      const output = document.createElement('output'); output.id = 'output-' + key; output.htmlFor = 'control-' + key;
      const input = document.createElement('input'); input.id = 'control-' + key; input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = sim.config[key];
      output.textContent = Number(input.value).toFixed(2);
      input.addEventListener('input', () => { output.textContent = Number(input.value).toFixed(2); });
      input.addEventListener('change', () => safe(() => { sim.action({ type: 'parameters', values: { [key]: Number(input.value) } }); render(); }));
      const note = document.createElement('p'); note.className = 'slider-hint'; note.textContent = hint;
      top.append(label, output); wrap.append(top, input, note); $('sliders').append(wrap);
    }
    $('curveControls').hidden = sim.lab.id !== 'curve';
    $('memoryControls').hidden = !['memory', 'feedback'].includes(sim.lab.id);
    $('scripted').disabled = sim.lab.schedule.length === 0;
    for (const id of ['origin', 'destination']) {
      $(id).replaceChildren();
      for (let a = 0; a < sim.worlds; a++) { const option = document.createElement('option'); option.value = a; option.textContent = 'World ' + a; $(id).append(option); }
    }
    $('origin').value = Math.min(1, sim.worlds - 1); $('destination').value = sim.worlds - 1;
    syncControls();
  }
  function syncControls() {
    $('scripted').checked = sim.config.scripted;
    $('toggleCurve').textContent = sim.config.curveLocked ? 'Open boundary links' : 'Close boundary links';
    for (const key of sim.lab.controls) {
      const input = $('control-' + key);
      if (document.activeElement !== input) { input.value = sim.config[key]; $('output-' + key).textContent = sim.config[key].toFixed(2); }
    }
  }
  function selectLab(id, restored) {
    setRunning(false); sim = restored || new E.Simulation({ lab: id });
    fieldRows = []; lastFieldStep = -1; lastLogCount = -1; comparisonToken++;
    const l = sim.lab;
    for (const [key, value] of Object.entries({ category: l.category, labTitle: l.title, subtitle: l.subtitle, description: l.description, experimentNumber: l.number, equation: l.equation, question: l.question, observe: l.observe, modelStatus: l.status })) $(key).textContent = value;
    $('stageTitle').textContent = l.field ? 'SCALAR FIELD / PERIODIC DOMAIN' : 'WORLD PROBABILITIES';
    $('stageCaption').textContent = l.field ? 'φ(x) above · signed field history below · periodic boundary' : 'Node size encodes probability · links encode allowed coupling';
    for (const button of document.querySelectorAll('.nav-button')) {
      const active = button.dataset.lab === l.id; button.classList.toggle('active', active);
      if (active) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
    }
    $('comparisonResult').replaceChildren(); const p = document.createElement('p'); p.className = 'empty-state';
    p.textContent = 'Compare this setup with: ' + l.ablation.name.toLowerCase() + '.'; $('comparisonResult').append(p);
    $('compare').disabled = false; $('compare').textContent = 'Run comparison';
    buildControls(); render();
    if (location.hash !== '#' + l.id) history.replaceState(null, '', '#' + l.id);
  }
  function canvasContext(id) {
    const canvas = $(id), width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight), dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) { canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr); }
    const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    return [ctx, width, height];
  }
  function line(ctx, x1, y1, x2, y2, color, width = 1) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
  function label(ctx, text, x, y, color = colors.muted, size = 10, align = 'center') { ctx.fillStyle = color; ctx.font = size + 'px ui-monospace, monospace'; ctx.textAlign = align; ctx.fillText(text, x, y); }
  function drawGraph() {
    const [ctx, w, h] = canvasContext('worldCanvas'), p = sim.populations(), cx = w / 2, cy = h / 2 - 16;
    // A static coordinate grid keeps the diagram legible when animation is paused.
    ctx.fillStyle = '#253540';
    for (let x = 20; x < w; x += 24) for (let y = 18; y < h - 25; y += 24) { ctx.beginPath(); ctx.arc(x, y, 0.7, 0, Math.PI * 2); ctx.fill(); }
    const radius = Math.min(w * 0.32, h * 0.31);
    const positions = Array.from({ length: sim.worlds }, (_, a) => {
      if (sim.worlds === 2) return [cx + (a ? 1 : -1) * Math.min(w * 0.24, 132), cy];
      const angle = -Math.PI / 2 + a / sim.worlds * 2 * Math.PI;
      return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
    });
    for (const [a, b] of sim.lab.edges) {
      const active = sim.activeEdge(a, b) && sim.config.coupling > 0;
      ctx.setLineDash(active ? [] : [5, 7]);
      line(ctx, ...positions[a], ...positions[b], active ? '#537050' : '#43515b', active ? 1.8 : 1);
      if (active) {
        const f = ((sim.time * 0.25 + a * 0.13) % 1), x = positions[a][0] * (1 - f) + positions[b][0] * f, y = positions[a][1] * (1 - f) + positions[b][1] * f;
        ctx.fillStyle = colors.lime; ctx.beginPath(); ctx.arc(x, y, 2, 0, 2 * Math.PI); ctx.fill();
      }
    }
    ctx.setLineDash([]);
    for (let a = 0; a < sim.worlds; a++) {
      const [x, y] = positions[a], r = 21 + 13 * Math.sqrt(Math.max(0, p[a])), outside = a >= sim.lab.boundary;
      const color = sim.lab.id === 'curve' && outside ? colors.coral : colors.lime;
      ctx.beginPath(); ctx.arc(x, y, r + 8, 0, 2 * Math.PI); ctx.strokeStyle = '#2a4033'; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI); ctx.fillStyle = '#102322'; ctx.fill(); ctx.strokeStyle = color; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y, r + 8, -Math.PI / 2, -Math.PI / 2 + Math.max(0, p[a]) * 2 * Math.PI); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
      label(ctx, 'W' + a, x, y - 3, color, 12); label(ctx, (p[a] * 100).toFixed(1) + '%', x, y + 13, '#e3ece7', 10);
    }
    if (sim.lab.id === 'curve') label(ctx, sim.config.curveLocked ? 'BOUNDARY CLOSED' : 'BOUNDARY OPEN', cx, h - 39, sim.config.curveLocked ? colors.coral : colors.lime, 9);
    if (sim.worlds === 2) label(ctx, 'κ = ' + sim.config.coupling.toFixed(2), cx, cy - 16, colors.muted, 10);
  }
  function drawField() {
    const [ctx, w, h] = canvasContext('worldCanvas'), margin = 40, width = w - 2 * margin, top = 32, bottom = h * 0.58, mid = (top + bottom) / 2;
    const max = Math.max(0.5, ...sim.field.phi.map(Math.abs)) * 1.12, half = (bottom - top) / 2;
    line(ctx, margin, mid, w - margin, mid, colors.line); line(ctx, margin, top, margin, bottom, colors.line);
    ctx.setLineDash([3, 5]);
    for (let a = 0; a < sim.worlds; a++) {
      const x = margin + sim.positions[a] / sim.field.length * width;
      line(ctx, x, top, x, bottom, '#243b3e'); label(ctx, 'W' + a, x, top - 12, colors.muted, 9);
    }
    ctx.setLineDash([]); ctx.beginPath();
    for (let i = 0; i < sim.field.n; i++) {
      const x = margin + i / (sim.field.n - 1) * width, y = mid - sim.field.phi[i] / max * half;
      if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = colors.lime; ctx.lineWidth = 2; ctx.stroke();
    label(ctx, max.toFixed(1), margin - 6, top + 5, colors.muted, 9, 'right'); label(ctx, '0', margin - 6, mid + 3, colors.muted, 9, 'right'); label(ctx, (-max).toFixed(1), margin - 6, bottom, colors.muted, 9, 'right');
    const hy = bottom + 24, hh = Math.max(30, h - hy - 38), rows = fieldRows.length;
    for (let row = 0; row < rows; row++) for (let i = 0; i < sim.field.n; i++) {
      const value = fieldRows[row][i], alpha = Math.min(1, Math.abs(value) / max);
      ctx.fillStyle = value >= 0 ? 'rgba(122,197,220,' + alpha + ')' : 'rgba(239,155,136,' + alpha + ')';
      ctx.fillRect(margin + i * width / sim.field.n, hy + row * hh / Math.max(1, rows), width / sim.field.n + 0.5, hh / Math.max(1, rows) + 0.5);
    }
    label(ctx, '0', margin, h - 22, colors.muted, 9); label(ctx, 'x = ' + sim.field.length, w - margin, h - 22, colors.muted, 9, 'right');
  }
  function drawMatrix() {
    const [ctx, w, h] = canvasContext('matrixCanvas'), r = E.reducedWorld(sim.rho), size = Math.min(h - 28, w - 85), cell = size / r.n, left = (w - size) / 2 + 8, top = 11;
    for (let a = 0; a < r.n; a++) for (let b = 0; b < r.n; b++) {
      const v = Math.hypot(r.re[a * r.n + b], r.im[a * r.n + b]);
      ctx.fillStyle = 'rgba(182,239,118,' + (0.05 + 0.95 * Math.min(1, v)) + ')'; ctx.fillRect(left + b * cell + 1, top + a * cell + 1, cell - 2, cell - 2);
      if (cell > 28) label(ctx, v.toFixed(2), left + (b + 0.5) * cell, top + (a + 0.5) * cell + 3, v > 0.55 ? '#142318' : '#c7d8cc', 9);
    }
    for (let a = 0; a < r.n; a++) { label(ctx, 'W' + a, left - 10, top + (a + 0.5) * cell + 3, colors.muted, 9, 'right'); label(ctx, 'W' + a, left + (a + 0.5) * cell, top + size + 15, colors.muted, 9); }
  }
  function drawHistory() {
    const [ctx, w, h] = canvasContext('historyCanvas'), left = 39, right = w - 20, top = 14, bottom = h - 30, end = Math.max(1, sim.time), current = sim.metrics();
    const rows = sim.history.slice(); if (!rows.length || rows[rows.length - 1].time !== current.time) rows.push(current);
    for (const value of [0, 0.5, 1]) { const y = bottom - value * (bottom - top); line(ctx, left, y, right, y, colors.line); label(ctx, value.toFixed(1), left - 8, y + 3, colors.muted, 9, 'right'); }
    for (const [key, color] of [['coherence', colors.lime], ['record', colors.coral], ['worldPurity', colors.blue]]) {
      ctx.beginPath(); rows.forEach((r, i) => { const x = left + r.time / end * (right - left), y = bottom - Math.max(0, Math.min(1, r[key])) * (bottom - top); if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.stroke();
    }
    for (const e of sim.log) { ctx.setLineDash([2, 5]); const x = left + e.time / end * (right - left); line(ctx, x, top, x, bottom, '#49605e'); } ctx.setLineDash([]);
    label(ctx, '0', left, bottom + 20, colors.muted, 9); label(ctx, 't = ' + end.toFixed(1), right, bottom + 20, colors.muted, 9, 'right');
  }
  function simpleTable(headers, rows) {
    const table = document.createElement('table'), thead = document.createElement('thead'), tbody = document.createElement('tbody'), tr = document.createElement('tr');
    for (const name of headers) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = name; tr.append(th); } thead.append(tr);
    for (const row of rows) { const r = document.createElement('tr'); for (const text of row) { const td = document.createElement('td'); td.textContent = text; r.append(td); } tbody.append(r); }
    table.append(thead, tbody); return table;
  }
  function render() {
    const m = sim.metrics(); $('clock').textContent = 't = ' + sim.time.toFixed(3);
    $('metricTrace').textContent = m.trace.toFixed(6); $('metricError').textContent = 'trace error ' + m.traceError.toExponential(1);
    $('metricCoherence').textContent = m.coherence.toFixed(3); $('metricRecord').textContent = m.record.toFixed(3);
    const fourth = sim.lab.field ? ['Field energy', m.fieldEnergy, '½ ∫ (φ̇² + c²φ′²) dx'] : sim.lab.id === 'curve' ? ['Exterior probability', m.outside, 'worlds 3, 4, and 5'] : ['World purity', m.worldPurity, 'Tr(ρworld²)'];
    $('metricFourthLabel').textContent = fourth[0]; $('metricFourth').textContent = fourth[1].toFixed(3); $('metricFourthHelp').textContent = fourth[2];
    if (sim.lab.field && sim.steps !== lastFieldStep) { fieldRows.push(Float64Array.from(sim.field.phi)); if (fieldRows.length > 100) fieldRows.shift(); lastFieldStep = sim.steps; }
    if (sim.lab.field) drawField(); else drawGraph(); drawMatrix(); drawHistory(); syncControls();
    if (lastLogCount !== sim.log.length) {
      $('eventCount').textContent = sim.log.length + ' EVENTS'; $('eventLog').replaceChildren();
      if (!sim.log.length) { const li = document.createElement('li'); li.textContent = 'No interventions yet.'; $('eventLog').append(li); }
      for (const event of sim.log.slice(-30).reverse()) { const li = document.createElement('li'), t = document.createElement('time'), text = document.createElement('span'); t.textContent = event.time.toFixed(3); text.textContent = (event.automatic ? 'Guided · ' : '') + event.message; li.append(t, text); $('eventLog').append(li); }
      lastLogCount = sim.log.length;
    }
    if (document.querySelector('.measurements').open) updateAccessible(m);
  }
  function updateAccessible(m = sim.metrics()) {
    const rows = [['Time', m.time.toFixed(5)], ['Total probability', m.trace.toPrecision(12)], ['Global purity', m.purity.toPrecision(10)], ['World purity', m.worldPurity.toPrecision(10)], ['Coherence', m.coherence.toPrecision(10)], ['Recorded bit probability', m.record.toPrecision(10)], ['Classical world-record mutual information (bits)', m.mutualInformation.toPrecision(8)], ['Field energy', m.fieldEnergy.toPrecision(8)], ...m.populations.map((p, a) => ['World ' + a + ' probability', p.toPrecision(10)])];
    $('measurementTable').replaceChildren(simpleTable(['Measurement', 'Value'], rows));
  }
  function download(text, filename, type) {
    const url = URL.createObjectURL(new Blob([text], { type })), link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  $('play').addEventListener('click', () => setRunning(!running));
  $('step').addEventListener('click', () => safe(() => { setRunning(false); sim.step(); render(); }));
  $('reset').addEventListener('click', () => selectLab(sim.lab.id));
  $('scripted').addEventListener('change', () => safe(() => { sim.action({ type: 'parameters', values: { scripted: $('scripted').checked } }); render(); }));
  $('toggleCurve').addEventListener('click', () => safe(() => { sim.action({ type: 'parameters', values: { curveLocked: !sim.config.curveLocked } }); render(); }));
  $('record').addEventListener('click', () => safe(() => { sim.action({ type: 'record', world: Number($('origin').value) }); render(); }));
  $('swap').addEventListener('click', () => safe(() => { sim.action({ type: 'swap', a: Number($('origin').value), b: Number($('destination').value) }); render(); }));
  $('erase').addEventListener('click', () => safe(() => { sim.action({ type: 'erase' }); render(); }));
  $('exportJSON').addEventListener('click', () => safe(() => download(JSON.stringify(sim.exportRecord(), null, 2) + '\n', 'efmw-' + sim.lab.id + '-run.json', 'application/json')));
  $('exportCSV').addEventListener('click', () => safe(() => download(sim.csv(), 'efmw-' + sim.lab.id + '-data.csv', 'text/csv')));
  $('importJSON').addEventListener('click', () => { setRunning(false); $('fileInput').click(); });
  $('fileInput').addEventListener('change', async () => {
    const file = $('fileInput').files[0]; if (!file) return;
    try { if (file.size > 5 * 1024 * 1024) throw new Error('Run file must be smaller than 5 MiB.'); notice('Reconstructing the saved run…');
      const record = JSON.parse(await file.text()), restored = E.replay(record); selectLab(restored.lab.id, restored); notice('Run reconstructed at t = ' + restored.time.toFixed(3) + '.');
    } catch (e) { notice(e.message, true); } finally { $('fileInput').value = ''; }
  });
  $('compare').addEventListener('click', () => {
    setRunning(false); const token = ++comparisonToken, config = Object.assign({}, sim.config);
    $('compare').disabled = true; $('compare').textContent = 'Computing…';
    setTimeout(() => {
      if (token !== comparisonToken) return;
      safe(() => {
        const result = E.compare(config), box = document.createElement('div'); box.className = 'comparison-table-wrap';
        const rows = [['World coherence', 'coherence'], ['World purity', 'worldPurity'], ['Recorded bit P(1)', 'record'], ['Exterior mass', 'outside'], ['Field energy', 'fieldEnergy']].map(([name, key]) => [name, result.enabled[key].toFixed(6), result.baseline[key].toFixed(6)]);
        box.append(simpleTable(['At t = ' + result.duration, 'Full setup', result.name], rows));
        const note = document.createElement('p'); note.className = 'comparison-note'; note.textContent = 'World-probability total variation: ' + result.totalVariation.toFixed(6) + '. A difference demonstrates the effect of this assumed mechanism in this model.';
        $('comparisonResult').replaceChildren(box, note);
      });
      $('compare').disabled = false; $('compare').textContent = 'Run comparison';
    }, 30);
  });
  document.querySelector('.measurements').addEventListener('toggle', () => updateAccessible());
  window.addEventListener('resize', () => { if (sim) render(); });
  window.addEventListener('hashchange', () => { const id = location.hash.slice(1); if (E.SERIES.some(x => x.id === id) && sim.lab.id !== id) selectLab(id); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) setRunning(false); });
  function frame(now) {
    if (running && now - lastFrame > 25) { safe(() => { sim.step(Math.min(Number($('speed').value), E.MAX_STEPS - sim.steps)); render(); }); lastFrame = now; }
    requestAnimationFrame(frame);
  }
  window.EFMWLab = Object.freeze({ snapshot: () => { setRunning(false); return sim.exportRecord(); } });
  setupNav(); const initial = location.hash.slice(1); selectLab(E.SERIES.some(x => x.id === initial) ? initial : 'portal'); requestAnimationFrame(frame);
})();
