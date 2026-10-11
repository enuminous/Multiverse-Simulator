# From simulation to screenplay

Version 1.1 adds an LLM writing layer to every experiment. It also includes a complete
original, unofficial Rick and Morty fan episode: **The Consequence Engine**,
15 scenes and 3,055 screenplay words. This is a compact episode draft; its performed
runtime has not been timed.

Open [the standalone episode reader](../episodes/consequence/episode.html), or open
`index.html`, scroll to **Episode writer**, and select **Read the sample episode**.
The reader can be printed or saved as PDF through your browser. The `.fountain`
file is plain-text screenplay source usable by screenplay editors.

The sample was authored by the ChatGPT assistant after executing and inspecting
the actual run. **No live API request generated that sample.** The separate API
adapter is implemented and tested with mocked responses. A key was not available
in the build environment, so live provider behavior remains unverified.

## The pipeline

1. Run or replay the numerical engine. Its existing physics is unchanged.
2. Recompute the evidence dossier from the replay instructions. Ignore any supplied
   endpoint measurements; the solver produces fresh measurements.
3. Select up to 15 regular checkpoints, plus every intervention timestamp.
   Multiple actions at the same timestamp share a post-intervention snapshot.
4. Give an LLM the dossier, an optional premise, and a strict JSON output schema.
5. Validate the returned script's shape, run label, acts, scene references, and
   coverage/order of the interventions.
6. Export JSON, Fountain, a self-contained HTML reader, a scene evidence audit,
   and provenance with SHA-256 fingerprints.

The conditional writing model is

\[
\mathcal D = \operatorname{extract}(\operatorname{simulate}(\rho_0,\phi_0,\text{controls})),
\qquad s \sim p_\theta(s\mid\mathcal D,\text{premise},\text{format}).
\]

The simulator constrains the story; the LLM invents its dramatic interpretation.
There is no feedback from generated prose into the completed numerical run.
Neither equation derives the canonical television story. No training or fine-tuning
is required by this integration.

## Immediate offline use

Node 20 or later; no npm dependencies or installation:

```bash
node scripts/episode.js --provider demo --out results/my-episode
```

This reruns the 14-unit sample scenario, checks the included script against it,
and writes a readable episode. It copies an already authored script; **demo is
not a local language model and does not generate new dialogue**.

To make a new prompt without an API connection:

```bash
node scripts/episode.js --lab memory --duration 8 --out results/memory-episode
node scripts/episode.js --replay examples/curve-run.json --out results/curve-episode
```

The default `manual` provider creates `run.json`, `dossier.json`, `prompt.txt`,
and `script-schema.json`. Paste the prompt into an LLM and save its JSON response
as `my-script.json`. Render and audit that response:

```bash
node scripts/episode.js --replay results/memory-episode/run.json --script my-script.json --out results/rendered
```

The browser supports the same manual flow: prepare a paused run, download its
prompt, and import the returned **script JSON**. Importing a script never executes
its text. Changing the experiment afterward does not change the captured dossier;
select **Prepare current run** again to capture new evidence.

## Generate with an API model

Select a model available to your account that supports the Responses API and
Structured Outputs. The project deliberately requires your model choice rather
than embedding a model alias that may change or be unavailable to your account.
Set `OPENAI_API_KEY` and `OPENAI_MODEL` in your local shell or secret manager.
Do not paste keys into HTML or commit them to GitHub.

Bash, with hidden key entry:

```bash
read -r -s -p "OpenAI API key: " OPENAI_API_KEY
export OPENAI_API_KEY
export OPENAI_MODEL="YOUR_SUPPORTED_MODEL_ID"
node scripts/episode.js --provider openai --out results/new-episode
```

PowerShell, with hidden key entry:

```powershell
$efmwKey = Read-Host "OpenAI API key" -AsSecureString
$env:OPENAI_API_KEY = [System.Net.NetworkCredential]::new('', $efmwKey).Password
$env:OPENAI_MODEL = "YOUR_SUPPORTED_MODEL_ID"
node scripts/episode.js --provider openai --out results/new-episode
```

The provider sends **one** request to `https://api.openai.com/v1/responses`.
It sends the numerical dossier and story premise; it sends no other local files.
It uses `store: false` and strict `text.format` JSON Schema. That setting does not
constitute a promise about every provider-side retention policy. API usage may
incur charges on your account. The static website never receives your API key.

For a different experiment or premise:

```bash
node scripts/episode.js --provider openai --lab decoherence --duration 12 --premise "A town mistakes lost interference for lost responsibility." --out results/phase-episode
node scripts/episode.js --provider openai --replay efmw-episode-run.json --model YOUR_SUPPORTED_MODEL_ID --max-tokens 24000 --out results/from-browser
```

`--max-tokens` defaults to 16,000 and accepts 1,024–32,000. The request times out
after four minutes. There are no automatic paid retries. Refusals, incomplete
responses, HTTP errors, malformed JSON, or failed script checks exit nonzero;
partial scripts are not silently accepted. The prompt and dossier remain available
for a manual retry. The adapter does not execute model-generated tools or code.

If the model needs more output space, raise `--max-tokens` within its supported
limits. A structural check cannot ensure a particular runtime, a good joke, or
perfect scientific fidelity; review the prose before publishing.

## Output files

| File | Contents |
|---|---|
| `run.json` | Initial conditions and interventions sufficient to replay |
| `dossier.json` | Recomputed checkpoints and interpretation rules |
| `prompt.txt` | Complete portable LLM prompt |
| `script-schema.json` | Required JSON shape |
| `script.json` | Structured scenes, source beat references, fictional additions |
| `episode.fountain` | Readable screenplay, without evidence annotations |
| `episode.html` | Self-contained, printable screenplay reader |
| `audit.json` | Scene-by-scene measurements and fictional bridges |
| `provenance.json` | Generation method, model when known, live-call flag, hashes |

Commands replace these named files inside `--out`. Old script outputs are removed
when a new dossier is written, so a failed generation cannot leave an old episode
apparently associated with a new run. Keep a separate output directory for each
episode you want to retain. Other files in the directory are left alone.

`run-xxxxxxxx` is a portable noncryptographic association label, not a tamper-proof
identity. Provenance SHA-256 hashes cover the canonical JSON source and script;
they are integrity fingerprints, not digital signatures. The full replay and
measurements remain available for inspection.

## Included scenario and evidence

| Time | Intervention or result | Narrative use |
|---:|---|---|
| 0 | Six worlds; exterior links closed | A supposedly contained showroom |
| 2 | Toggle bit in world 1; P(1) = 0.399466611 | A portable transit receipt |
| 4 | Open the boundary | Expansion exports the problem |
| 5 | Exterior weight = 0.258752933 | Outside worlds enter the story |
| 6 | Swap worlds 1 and 4; bit marginal preserved | Moving premises retains the receipt |
| 8 | Set dephasing to 0.65 | Quieting interference is mistaken for repair |
| 9 | Coherence 0.290299909; field energy 0.525871850 | Two diagnostics tell different stories |
| 10 | Discard bit; world state and field retained | Clearing a receipt leaves damage |
| 12 | Stop source, feedback return, and portal coupling | End ongoing driving and transport |
| 14 | Energy falls to 0.273880812; amplitude reaches 2.109308942 | Stopping the cause is not a reset |

Character routes, civic damage, motives, personal memories, and the family subplot
are invented. The external extraction gadget in scene 14 is explicitly outside
the zero-coupling experiment: the simulated probability distribution does not
reset or travel home. Register erasure is not a model of human forgetting.

## All six experiments

`episodes/series/` contains six executed prompt packs, one per default experiment
at t = 8. These are starting points for six additional scripts, not six completed
screenplays. Use `--lab` to generate any of them, or adapt the saved prompts.

The browser and GitHub Pages provide the simulator, sample reader, and prompt
workflow. GitHub Pages cannot run the Node API adapter; use the CLI locally.
No web server or browser extension is required for the manual/offline path.

## What checks can establish

The validator rejects wrong run labels, unknown beat IDs, missing interventions,
first references to interventions in the wrong order, missing/reordered acts,
invalid scene shapes, and overly large fields. The API schema constrains the
JSON structure. **Neither validates the semantics of prose automatically.**

The sample's numerical displays were checked against its dossier during authoring.
Future LLM scripts still require an editorial science check. Simulation reproducibility
does not make stochastic LLM outputs reproducible; preserve the script and provenance.

Primary API reference: [OpenAI Structured Outputs, Responses API](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses),
consulted October 11, 2026.
