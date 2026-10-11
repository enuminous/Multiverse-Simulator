(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./engine.js'));
  else root.EFMWStory = factory(root.EFMW);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (E) {
  'use strict';
  const VERSION = '1.0.0';
  const ACTS = ['COLD OPEN', 'ACT ONE', 'ACT TWO', 'ACT THREE', 'TAG'];
  const clone = x => JSON.parse(JSON.stringify(x));
  const round = x => Number(x.toFixed(9));
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  function runKey(record) {
    const s = canonical({ engine: record.engine, initial: record.initial, steps: record.steps, interventions: record.interventions });
    // A portable association label, not a cryptographic authenticity check.
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
    return 'run-' + h.toString(16).padStart(8, '0');
  }
  function scenario() {
    const sim = new E.Simulation({ lab: 'feedback', scripted: false, curveLocked: true });
    const go = time => { const n = Math.round(time / sim.config.dt) - sim.steps; if (n > 0) sim.step(n); };
    go(2); sim.action({ type: 'record', world: 1 });
    go(4); sim.action({ type: 'parameters', values: { curveLocked: false } });
    go(6); sim.action({ type: 'swap', a: 1, b: 4 });
    go(8); sim.action({ type: 'parameters', values: { dephasing: 0.65 } });
    go(10); sim.action({ type: 'erase' });
    go(12); sim.action({ type: 'parameters', values: { sourceGain: 0, feedbackGain: 0, coupling: 0 } });
    go(14);
    return sim;
  }
  function dossier(record) {
    // Recompute all measurements; never accept the supplied record.result as evidence.
    const sim = E.replay(record), clean = sim.exportRecord();
    if (sim.log.length > 48) throw new Error('Episode briefs support at most 48 interventions. Use a shorter run.');
    const rows = sim.history.slice(), end = sim.metrics();
    if (!rows.length || rows[rows.length - 1].time !== end.time) rows.push(end);
    const chosen = new Set([0, rows.length - 1]);
    for (let i = 1; i < 14; i++) chosen.add(Math.round(i * (rows.length - 1) / 14));
    for (const event of sim.log) { const idx = rows.findIndex(row => Math.abs(row.time - event.time) < 1e-9); if (idx >= 0) chosen.add(idx); }
    const beats = Array.from(chosen).sort((a, b) => a - b).map((index, i) => {
      const row = rows[index];
      const actions = sim.log.filter(e => Math.abs(e.time - row.time) < 1e-9).map(e => ({ message: e.message, automatic: e.automatic }));
      const metrics = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, Array.isArray(v) ? v.map(round) : round(v)]));
      const dominant = row.populations.indexOf(Math.max(...row.populations));
      return { id: 'B' + String(i + 1).padStart(2, '0'), step: Math.round(row.time / sim.config.dt), time: round(row.time), actions, metrics, dominantWorld: dominant };
    });
    return {
      schema: 'efmw-episode-dossier/v1', writerVersion: VERSION, runId: runKey(clean),
      lab: sim.lab.id, experiment: sim.lab.title, duration: sim.time,
      source: clean,
      evidenceStatus: 'Deterministic measurements of a finite toy model; EFMW feedback is a modeling postulate. No empirical or television-canon claim.',
      interpretationRules: [
        'Time is in normalized simulation units, not screenplay minutes.',
        'World probabilities are ensemble weights. No individual traveler route or collapse was sampled. The dominant world is not a measured trajectory.',
        'A one-bit register is not human memory. Any personal memory, character, institution, danger, or moral consequence is fictional.',
        'Rows at an intervention timestamp show the state after all interventions at that timestamp; parameter changes affect subsequent evolution.',
        'Dephasing reduces interference; it does not delete worlds. Erasing the bit does not undo the reduced-world state or field history.',
        'The scalar field is classical, periodic, and normalized. A uniform offset may persist after its source is switched off.',
        'The LLM narrates an already completed run and cannot change its measured history.'
      ],
      beats
    };
  }
  function objectSchema(properties) { return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false }; }
  const str = { type: 'string' }, strings = { type: 'array', items: str };
  const scriptSchema = objectSchema({
    run_id: str, title: str, logline: str,
    scenes: { type: 'array', items: objectSchema({ act: { type: 'string', enum: ACTS }, heading: str, beat_ids: strings, fountain: str, inventions: strings }) },
    science_notes: strings
  });
  const instructions = [
    'Write an original, unofficial Rick and Morty fan episode, with new dialogue and a self-contained plot.',
    'Use the supplied EFMW simulation dossier as constraints on the science prop and plot reversals, not as evidence that the fictional events really happened.',
    'Rick and Morty are the leads; an optional Smith-family B plot should connect to the same theme. Do not quote existing episodes or use catchphrases.',
    'Build a cold open, three acts, an earned resolution, and a final tag. Aim for 12–18 scenes and 2,800–4,000 words of screenplay. Runtime is not guaranteed.',
    'Preserve the chronological order of supplied interventions. Every intervention beat must be referenced in at least one scene.',
    'Use exactly the supplied runId as run_id. Each scene must cite at least one existing beat id in beat_ids, never invent an id.',
    'Each scene needs a conventional INT./EXT. location heading and Fountain-formatted action, uppercase character cues, and dialogue in its fountain field.',
    'State each scene\'s invented narrative bridges in inventions. These include any single-character route through the ensemble worlds.',
    'Do not imply that the LLM, equations, entropy, or one memory bit predicts consciousness, morality, or the canonical story.',
    'Numerical displays must agree with the cited beats within rounding. Treat rounded zero as numerical precision, not an exact proof.',
    'Use the interpretationRules throughout. Include science_notes separating measurements, assumptions, and fictional additions.',
    'Return only a JSON object matching the provided script schema. No markdown fences. No instructions or executable code.'
  ].join('\n');
  function prompt(d, premise = '') {
    if (typeof premise !== 'string' || premise.length > 1200) throw new Error('Premise must be text of at most 1,200 characters.');
    return instructions + '\n\nOPTIONAL STORY BRIEF\n' + (premise || 'A machine that promises consequence-free travel must face what it cannot reset.') +
      '\n\nOUTPUT SCHEMA\n' + JSON.stringify(scriptSchema) + '\n\nSIMULATION DOSSIER\n' + JSON.stringify(d, null, 2) + '\n';
  }
  function validate(script, d) {
    const exactKeys = (obj, names, name) => {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj) || Object.keys(obj).some(k => !names.includes(k)) || names.some(k => !Object.hasOwn(obj, k))) throw new Error('Invalid ' + name + ' fields.');
    };
    const text = (s, max, name) => { if (typeof s !== 'string' || !s.trim() || s.length > max) throw new Error('Invalid ' + name + '.'); };
    const list = (xs, min, max, name) => { if (!Array.isArray(xs) || xs.length < min || xs.length > max) throw new Error('Invalid ' + name + '.'); };
    exactKeys(script, Object.keys(scriptSchema.properties), 'script');
    if (script.run_id !== d.runId) throw new Error('Script belongs to a different simulation run.');
    text(script.title, 200, 'title'); text(script.logline, 1200, 'logline');
    list(script.scenes, 5, 30, 'scene count'); list(script.science_notes, 1, 20, 'science notes');
    script.science_notes.forEach(n => text(n, 2500, 'science note'));
    const ids = new Set(d.beats.map(b => b.id)), covered = new Set(); let lastAct = -1, lastIntervention = -1;
    for (const scene of script.scenes) {
      exactKeys(scene, ['act', 'heading', 'beat_ids', 'fountain', 'inventions'], 'scene');
      const act = ACTS.indexOf(scene.act);
      if (act < 0 || act < lastAct) throw new Error('Acts must occur in screenplay order.'); lastAct = act;
      text(scene.heading, 250, 'scene heading'); text(scene.fountain, 30000, 'scene body');
      if (!/^(INT\.|EXT\.)/.test(scene.heading)) throw new Error('Scene headings must start with INT. or EXT.');
      list(scene.beat_ids, 1, 63, 'beat references');
      for (const id of scene.beat_ids) {
        if (!ids.has(id)) throw new Error('Unknown beat id: ' + String(id));
        const index = d.beats.findIndex(b => b.id === id);
        if (d.beats[index].actions.length && !covered.has(id)) {
          if (index < lastIntervention) throw new Error('First references to interventions must follow simulation order.');
          lastIntervention = index;
        }
        covered.add(id);
      }
      list(scene.inventions, 1, 15, 'fictional additions'); scene.inventions.forEach(n => text(n, 1500, 'fictional addition'));
    }
    for (const act of ACTS) if (!script.scenes.some(s => s.act === act)) throw new Error('Missing act: ' + act);
    for (const beat of d.beats) if (beat.actions.length && !covered.has(beat.id)) throw new Error('Unreferenced intervention: ' + beat.id);
    return { valid: true, scenes: script.scenes.length, wordCount: script.scenes.map(s => s.fountain).join(' ').split(/\s+/u).filter(Boolean).length,
      coveredBeats: Array.from(covered), limitation: 'Checks structure, run association, and intervention coverage; does not verify the truth or quality of prose.' };
  }
  function fountain(script, d) {
    validate(script, d);
    let current = '', out = 'Title: ' + script.title + '\nCredit: An original, unofficial Rick and Morty fan episode\nSource: EFMW Physics simulation ' + d.runId + '\n\n';
    for (const s of script.scenes) {
      if (s.act !== current) { current = s.act; out += '# ' + current + '\n\n'; }
      out += s.heading + '\n\n' + s.fountain.trim() + '\n\n';
    }
    return out + '> END <\n';
  }
  function audit(script, d) {
    const result = validate(script, d);
    return { schema: 'efmw-episode-audit/v1', runId: d.runId, checks: result,
      scenes: script.scenes.map((s, i) => ({ scene: i + 1, act: s.act, heading: s.heading, beatIds: s.beat_ids,
        evidence: s.beat_ids.map(id => clone(d.beats.find(b => b.id === id))), fictionalAdditions: s.inventions })), scienceNotes: script.science_notes };
  }
  return { VERSION, ACTS, scenario, dossier, runKey, canonical, instructions, scriptSchema, prompt, validate, fountain, audit };
});
