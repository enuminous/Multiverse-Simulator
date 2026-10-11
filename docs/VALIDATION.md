# Validation record

Release: **1.1.0** (numerical engine 1.0.0). Checked locally on **October 11, 2026**.

## Executed checks

The dependency-free Node test suite passed **38 tests**: 20 numerical/state/replay
tests, four simulator command-line tests, and 14 episode/LLM pipeline tests. It exercises all six default
experiments through t = 20 and all six t = 8 ablations. The static checker verifies
local page references, controller element IDs, and JavaScript syntax.

Commands:

```bash
node --test
node scripts/check.js
python3 tests/reference_check.py --out examples/reference-validation.json
node scripts/series.js examples
node scripts/build.js
```

The test scripts are part of the package. `examples/reference-validation.json`
contains machine-readable independent-reference measurements. The optional
reference uses NumPy 2.3.5; it is not a runtime dependency of the simulator.

## Independent linear-algebra check

NumPy's `eigh` recomputed the frozen Hamiltonian exponential for the last step
of each default t = 8 trajectory, including the specified dephasing halves.
Its density-matrix result was compared element-by-element with the JavaScript
engine. NumPy separately checked the eigenvalues of the density matrices.

| Experiment | Maximum one-step difference | Trace error at t = 8 |
|---|---:|---:|
| Portal | 4.44 × 10⁻¹⁶ | 1.23 × 10⁻¹⁴ |
| Finite curve | 4.91 × 10⁻¹⁶ | 2.75 × 10⁻¹⁴ |
| Carried record | 3.33 × 10⁻¹⁶ | 6.46 × 10⁻¹⁴ |
| Decoherence | 1.67 × 10⁻¹⁶ | 1.38 × 10⁻¹³ |
| Sourced field quantum sector | 0 | 0 |
| Feedback | 3.89 × 10⁻¹⁶ | 2.40 × 10⁻¹⁴ |

The most negative independent density-matrix eigenvalue was approximately
−1.59 × 10⁻¹⁵, consistent with floating-point error and well inside the −1e−10
acceptance threshold. This is not a proof for every possible parameter setting.

## Field accuracy

The exact source-free periodic Fourier solution was checked at t = 2 while both
space and time resolution were refined. RMS errors were:

| Grid points | Time step | RMS error |
|---:|---:|---:|
| 64 | 0.025 | 0.0039925188 |
| 128 | 0.0125 | 0.0009989144 |
| 256 | 0.00625 | 0.0002497774 |

Successive error ratios were **3.9969** and **3.9992**, consistent with second-order
convergence for that smooth reference problem. Separate tests confirm the exact
zero solution and loss of unforced field energy under positive damping.

## Hybrid accuracy

For the default feedback experiment at t = 4, the density-matrix Frobenius errors
against a dt = 0.003125 reference were:

| Time step | Density-matrix error |
|---:|---:|
| 0.025 | 0.0052326253 |
| 0.0125 | 0.0022302657 |
| 0.00625 | 0.0007413370 |

The errors decrease on refinement. These finite-reference ratios are not a fitted
convergence-order claim. The combined explicit feedback scheme is generally
first order; the reference is itself numerical, not an exact solution. Default
interactive trajectories should be interpreted with that discretization error
in mind rather than at machine-precision physical accuracy.

## Reproducibility and packaging

- CLI export/replay reconstructs the endpoint measurements exactly on the same
  runtime in the integration test.
- A mixed sequence of parameter changes, guided events, swaps and endpoint
  record-discard operations reconstructs the density matrix and field within 1e−13.
- The batch command produces six JSON runs, six CSVs, and all six comparisons.
- The static build assembles only the page, local assets, engine, examples and docs.
- The delivered ZIP contains the complete source, tests, workflows and examples.
- The static browser application makes no API calls or telemetry requests. The optional Node episode writer sends its dossier and premise to OpenAI only when the `openai` provider is explicitly selected.

## Episode writer validation

The 14-unit consequence scenario was executed for 560 time steps. Its replay,
15 evidence checkpoints, six interventions, and numerical endpoints are included
in `episodes/consequence/`. All six default t = 8 experiments were also executed
and exported as episode prompt packs.

The added tests verify:
- Replay-derived dossiers ignore supplied endpoint claims and include same-time interventions.
- The sample covers all five act sections, all intervention references, and 15 scenes.
- Wrong runs, invented beat IDs, missing events, invalid acts, and reordered first intervention references are rejected.
- HTML exports escape model-authored markup, and the offline sample matches its canonical files.
- The API adapter sends the intended Structured Outputs request, handles refusals and incomplete/invalid output, and does not retry failures automatically.
- Full offline CLI export/import works, missing credentials fail clearly, and starting a new run clears stale script outputs.

All API tests use mocks. There was **no live API call**. The sample was authored
by the ChatGPT assistant after reading the executed simulation, and its provenance
records that distinction. Its numerical displays were checked against the dossier;
its character events, dialogue, and single-traveler routes are fiction.

The static checker passed **120 checks**, and the static build completed. This
includes local references, controller DOM IDs, and JavaScript syntax; it is not a
live-browser or screen-reader test. The numerical reference checks above apply
to the unchanged engine and retain the previously executed measurements.

## Verification not performed

**A real browser preview was unavailable in the build environment.** Consequently,
visual layout, canvas rendering, downloads, file imports, mobile browser behavior,
keyboard navigation and screen-reader usability have not been verified in a live
browser. Static checks and shared-engine tests do not replace that review.
The manual checklist is in `docs/DEVELOPMENT.md`.

Live provider access, model-specific output behavior, and the performed runtime of the screenplay were not tested.

The GitHub workflows were prepared from current official action documentation but
were not executed on GitHub. No repository was created or pushed and no Pages site
was deployed for this ZIP-only request.

No Lean formalization, complete named Zoo audit, empirical physics validation,
clinical or cognitive assessment, or full quantum-field simulation was performed.
