# Extending the series

The core is a dependency-free UMD module. Node imports it with `require`; a classic
browser script exposes `window.EFMW`. There is deliberately no fetch-based preset
loading or ES-module import, so the page can run from an extracted local folder.

## Public engine surface

```javascript
const E = require('./src/engine.js');
const sim = new E.Simulation({lab: 'memory', coupling: 0.75});
sim.step(60);
sim.action({type: 'record', world: 1});
sim.action({type: 'swap', a: 1, b: 3});
console.log(sim.metrics());
const rebuilt = E.replay(sim.exportRecord());
const comparison = E.compare(sim.config, 8);
```

Initial settings are validated in `validatedConfig`. Runtime edits use a
`parameters` action. Geometry, dt, and fieldEnabled cannot change during a run:
start a new simulation instead. Programmatic access to matrices is intentionally
available for research, but direct edits are not captured by replay exports.
Replay fidelity is guaranteed only for initial configurations and supported
actions, not arbitrary mutation of internal arrays.

## Add an experiment

1. Add a definition to `src/series.js`, with unique ID, world count, symmetric
   edge list, world energies, initial config, schedule, question and ablation.
2. Freeze the model in `docs/EQUATIONS.md` before interpreting its output.
3. Add an independent reference or falsification check to the tests.
4. Add parameter descriptions to `assets/app.js` if introducing a new control.
5. Regenerate example outputs and document the engine-version change.

The current browser narration and layouts assume two, four, or six worlds and a
two-state memory register. More general dimensions require an explicit engine,
configuration, and interface update, not just a larger array.

## Replay schema

`efmw-multiverse-run/v1` contains `engine`, `initial`, `steps`, `interventions`,
and a diagnostic `result`. The result is not trusted during import: the initial
state and ordered interventions regenerate the trajectory. An intervention has
an integer step number and an action. Multiple actions at the same step retain
their order. Endpoint actions are applied even if no further step follows.

Supported actions: `parameters`, `record`, `swap`, and `erase`. Unknown actions,
negative steps, unsorted interventions, unknown parameters, incompatible versions,
and unstable grids are rejected. Browser and CLI file imports are limited to
5 MiB. Configuration data is never evaluated as code or inserted as HTML.

## Tests and checks

```bash
node --test
node scripts/check.js
python3 tests/reference_check.py --out results/reference-validation.json
```

The optional independent reference requires NumPy. It is not needed for the app,
CLI, core tests, or Pages build. The core package has no npm dependencies.

The source field and quantum state deliberately expose different diagnostics.
Do not report classical field energy as total system energy, world coherence as
the EFMW residual monitor, or the one-bit register as validated cognition.

## Manual UI checklist

This is a checklist for a real browser review, not a claim it has been performed.

- Load `index.html` offline; inspect every experiment at desktop and narrow widths.
- Run, pause, step, reset, and resize while paused and running.
- Release each slider and verify the change appears in the event log.
- Observe curve opening, record toggling, and world swapping at scheduled times.
- Export JSON, reset, import, and compare endpoint measurements.
- Export CSV and inspect column headers and endpoint time.
- Compare an ablation and read its fresh-run behavior.
- Operate navigation and controls using only the keyboard.
- Expand the accessible measurement table and inspect it with a screen reader.
- Verify downloads and local-file permissions in the intended mobile browser.

## Episode writer extension

`src/story.js` runs in browser and Node, replays the engine, and builds an evidence
brief. `src/llm.js` is Node-only. `scripts/episode.js` handles provider selection,
exports, and provenance. The browser does not call the API or handle keys.
The prewritten sample is bundled in `assets/demo-episode.js` for `file://` use;
it is explicitly labelled as a sample rather than fresh generation.

When editing the sample, regenerate the browser bundle from `dossier.json`,
`script.json`, and `provenance.json`, then run the tests. The test suite compares
its script and dossier with the canonical files and replays the measurements.

Manual browser checks still required:
- Load the sample and inspect all scene evidence selections.
- Capture a running experiment; confirm it pauses and the context changes.
- Download prompt/replay, import matching script JSON, and reject a wrong-run script.
- Download Fountain and open the standalone HTML reader; check print layout.
- Check keyboard access and mobile wrapping in the writer and screenplay areas.
- Confirm that preparing a new run clears the previously displayed script.

`node --test` uses mocked API responses, never a real key or paid call. Live API
smoke tests require an independently configured account/model and are not part of CI.
