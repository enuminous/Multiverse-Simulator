# EFMW Physics · Multiverse Simulator Series

<!-- ENUMINOUS-NETWORK:START -->
**eNuminous network:** [All repositories](https://enuminous.github.io/EFMW/repositories.html) · [EFMW](https://enuminous.github.io/EFMW/) · [102 equations](https://github.com/enuminous/Monolithic_102_EFMW) · [165 triplets](https://enuminous.github.io/FieldSpace/) · [Zoo](https://enuminous.github.io/Tortoise/) · [Lean](https://enuminous.github.io/Aristotle-102-Monolithic-Lean/) · [Engine](https://enuminous.github.io/Archimedes-Engine/) · [Papers](https://enuminous.github.io/medium/papers-essays-index.html) · [Audit](https://github.com/enuminous/EFMW_Post156_Zoo_Audit/blob/main/portfolio/INTERLOCK_AUDIT.md)

[Repository](https://github.com/enuminous/Multiverse-Simulator) · [Published page](https://enuminous.github.io/Multiverse-Simulator/)

<details>
<summary>Recent repositories (9)</summary>

- [Oroboros](https://github.com/enuminous/Oroboros) · [README](https://github.com/enuminous/Oroboros/blob/main/README.md) · [Page](https://enuminous.github.io/Oroboros/)
- [P-NP](https://github.com/enuminous/P-NP) · [README](https://github.com/enuminous/P-NP/blob/main/README.md) · [Page](https://enuminous.github.io/P-NP/)
- [Research-Program](https://github.com/enuminous/Research-Program) · [README](https://github.com/enuminous/Research-Program/blob/main/README.md) · [Page](https://enuminous.github.io/Research-Program/)
- [I-Have-Guts](https://github.com/enuminous/I-Have-Guts) · [README](https://github.com/enuminous/I-Have-Guts/blob/main/README.md) · [Page](https://enuminous.github.io/I-Have-Guts/)
- [Wrights-Law](https://github.com/enuminous/Wrights-Law) · [README](https://github.com/enuminous/Wrights-Law/blob/main/README.md) · [Page](https://enuminous.github.io/Wrights-Law/)
- [Aristotle-eNuminous](https://github.com/enuminous/Aristotle-eNuminous) · [README](https://github.com/enuminous/Aristotle-eNuminous/blob/main/README.md) · [Page](https://enuminous.github.io/Aristotle-eNuminous/)
- [Multiverse-Simulator](https://github.com/enuminous/Multiverse-Simulator) · [README](https://github.com/enuminous/Multiverse-Simulator/blob/main/README.md) · [Page](https://enuminous.github.io/Multiverse-Simulator/)
- [accelerando-8192](https://github.com/enuminous/accelerando-8192) · [README](https://github.com/enuminous/accelerando-8192/blob/main/README.md) · [Page source](https://github.com/enuminous/accelerando-8192/blob/main/docs/index.html)
- [Codex-888](https://github.com/enuminous/Codex-888) · [README](https://github.com/enuminous/Codex-888/blob/main/README.md) · [Page](https://enuminous.github.io/Codex-888/)

</details>

<details>
<summary>Repository indexes (1)</summary>

- [index.html](https://github.com/enuminous/Multiverse-Simulator/blob/main/index.html) · [Open page](https://enuminous.github.io/Multiverse-Simulator/index.html)

</details>
<!-- ENUMINOUS-NETWORK:END -->

**Six working physics experiments, an LLM episode writer, and a complete original Rick and Morty fan screenplay.**

Created for **Matthew Chenoweth Wright / Monolithic LLC**, October 11, 2026.
Version **1.1.0** (numerical engine remains 1.0.0). Suggested repository name: **EFMW-Multiverse-Simulator**.

This project turns the conversation's Rick-and-Morty-inspired narrative equation into a bounded computational model:

\[
i\hbar\partial_t\Psi_a=\widehat H_a\Psi_a+
\sum_{b\ne a}\widehat K_{ab}\Psi_b.
\]

The executable version uses a finite world graph, a one-bit memory register, density matrices, and an optional classical source field. It is a simulator of explicitly stated assumptions. It does **not** claim to derive the television story or establish EFMW, portals, or consciousness as experimentally validated physics.

## Start immediately

1. Extract the ZIP.
2. Open **`index.html`** in a modern desktop browser.
3. Choose an experiment and select **Run experiment**.

No installation, build, CDN, API key, account, or network connection is required for the simulator, included episode, or prompt export. New automatic LLM generation uses the optional Node API adapter. All browser scripts and styling are local. On mobile, an extracted HTML folder may be easier to use through GitHub Pages, because some file viewers do not execute local JavaScript.

Optional local HTTP server (Python 3):

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://localhost:8000`. Stop the server with Ctrl+C.

## Read or generate an episode

Open **[The Consequence Engine](episodes/consequence/episode.html)**: 15 scenes,
3,055 screenplay words, a cold open, three acts, and a final tag. The episode uses
an actual 14-unit simulation. It was authored by the ChatGPT assistant from the
measured results, not by a live API request.

The **Episode writer** section in `index.html` can load the sample, prepare your
current run, export an LLM prompt, import a returned script, and show the evidence
behind each scene. All six experiments can become new writing prompts.

```bash
# Re-run the included scenario and export the supplied screenplay, offline.
node scripts/episode.js --provider demo --out results/episode

# Simulate and prepare a new prompt, without a network call.
node scripts/episode.js --lab memory --duration 8 --out results/memory-episode

# With OPENAI_API_KEY and OPENAI_MODEL configured in your shell:
node scripts/episode.js --provider openai --out results/new-episode
```

Automatic generation produces structured scene JSON, Fountain, a printable HTML
reader, an evidence audit, and provenance. **[Read the writer setup guide](docs/EPISODE-WRITER.md)**
for key setup, custom premises, replay import, and failure handling. The optional
API adapter is tested with mocks; a live call was not possible without credentials.

## The six experiments

| # | Experiment | Implemented mechanism | Main observation |
|---|---|---|---|
| 01 | Portal oscillations | Two-state Hermitian Hamiltonian | Exact Rabi transfer and probability conservation |
| 02 | The finite curve | Boundary-crossing graph links switch off/on | No exterior leakage when disconnected |
| 03 | The carried record | World-controlled record gate, then a world swap | Location changes while the memory marginal is preserved |
| 04 | Losing the phase | Completely positive world-dephasing channel | Coherence decays without loss of total probability |
| 05 | The sourced field | Periodic 1D forced wave equation | Source-driven propagation, damping, grid convergence |
| 06 | Worlds with feedback | Population sources field; field shifts world energies | Comparison with field-to-world coupling removed |

Each experiment includes an equation, live controls, numerical measurements, a comparison with one mechanism removed, and documentation. The page can open directly to `#portal`, `#curve`, `#memory`, `#decoherence`, `#field`, or `#feedback`.

## What you can do

- Run, pause, single-step, reset, and change playback speed.
- Change parameters during a run; every committed change is recorded.
- Toggle the finite-curve boundary and the guided event sequence.
- Record a world in a memory bit, swap world labels while carrying the bit, or discard the register.
- Inspect world probabilities, density-matrix magnitudes, coherence, global and reduced purity, record probability, and field energy.
- Export complete replay instructions as JSON and sampled measurements as CSV.
- Import browser or command-line JSON to reconstruct the same run.
- Run all six experiments and their ablations from the command line.
- Turn a captured run into an LLM brief, generate structured scenes, and inspect scene-to-measurement references.

**Guided event timing:** an event at time t runs at the start of the step beginning at t. At non-default time steps, event times round to the nearest step. Turning the sequence on after a scheduled time does not replay a missed event. Reset returns to preset defaults.

**Comparison behavior:** comparisons start fresh at t = 0 from the *current control settings*. They run to t = 8 and include guided events if enabled. They do not reproduce your manual intervention history. Imported JSON does reproduce that history.

## Reproduce from the command line

Node.js 20 or later is required for these commands. There are no npm dependencies and `npm install` is unnecessary.

```bash
npm test
npm run check
node scripts/simulate.js --lab portal --duration 8 --out results/portal
node scripts/simulate.js --lab feedback --set feedbackGain=0 --out results/no-feedback
node scripts/simulate.js --replay examples/memory-run.json --out results/replayed
node scripts/series.js results
```

`--out` and the series command replace files at the specified destination. The series command creates six JSON replay files, six CSV files, and `comparisons.json`.

Additional examples:

```bash
node scripts/simulate.js --lab curve --set scripted=false --set curveLocked=true
node scripts/simulate.js --lab decoherence --set coupling=0 --set detuning=0 --set dephasing=0.4
node scripts/simulate.js --lab field --set gridPoints=256 --set dt=0.0125
```

All units are normalized: ℏ = 1 for the finite quantum model. Time, domain length, source amplitude, and energies are **not calibrated to real SI measurements**.

## Publish on GitHub Pages

Upload the extracted folder's **contents** to the root of a repository. For the shortest route, choose **Settings → Pages → Deploy from a branch → main → /(root)**.

A separate, manually triggered Actions workflow is included for users who choose **GitHub Actions** as the Pages source. It tests the project, assembles `dist/`, and deploys it. See [the exact steps](docs/GITHUB.md). No repository or website is published merely by downloading this ZIP.

## Documentation

- [LLM episode writer, sample, and API setup](docs/EPISODE-WRITER.md)
- [Episode and six prompt packs](episodes/README.md)

- [Equations, normalization, operators, and numerical scheme](docs/EQUATIONS.md)
- [Six experiment protocols and ablations](docs/EXPERIMENTS.md)
- [Claims, assumptions, proof obligations, and limits](docs/CLAIMS.md)
- [Executed validation and remaining verification](docs/VALIDATION.md)
- [GitHub and Pages setup](docs/GITHUB.md)
- [Primary sources and provenance](docs/SOURCES.md)
- [Extension guide](docs/DEVELOPMENT.md)
- [Release notes](CHANGELOG.md)

## Project layout

```text
index.html                  Offline interactive laboratory
assets/                     Styling, browser controller, icon
src/engine.js               Shared numerical engine (browser + Node)
src/series.js               Six experiment definitions
src/story.js                Evidence extraction, prompts, schema, scene validation
src/llm.js                  Node-only OpenAI Responses adapter
scripts/episode.js          Simulation-to-screenplay CLI
episodes/                   Full sample episode and six executed prompt packs
scripts/simulate.js         Single run, export, and replay CLI
scripts/series.js           All six runs and ablations
scripts/build.js            Assemble a static dist/ directory
scripts/check.js            Static links, DOM IDs, and syntax checks
tests/                      Numerical and CLI regression tests
examples/                   Reproducible runs and measured outputs
docs/                       Model specification and evidence
.github/workflows/          CI and optional Pages deployment
```

## Scope and attribution

The mathematical source template and EFMW framing are attributed to Matthew Chenoweth Wright. The finite truncation, one-bit register, dephasing implementation, normalized source adapter, and feedback experiment are implementation choices made for this package; they are not presented as previously established EFMW axioms.

The connection to *Rick and Morty* is an interpretive inspiration. This independent project includes original fan dialogue, but no copied episode dialogue, show footage, character artwork, or endorsement. Project rights are recorded in [LICENSE.txt](LICENSE.txt).
