# The six-experiment series

All default protocols start at t = 0, use Δt = 0.025, and compare endpoints at
t = 8 (320 steps). `examples/` contains the actual runs produced for this release.
The same engine executes in the browser and CLI. No random seed is needed because
there is no random sampling.

## 01 — Portal oscillations

**Question:** Does a coherent two-state connection transfer amplitude as predicted?

Initial state: |world 0, record 0⟩. κ = 0.8; zero detuning. Two worlds with one edge.
Run to t = 8; adjust κ to change the oscillation period. Set energy contrast above
zero to reduce maximum transfer through detuning.

**Ablation:** κ = 0. **Reference:** p₁ = sin²(κt) at zero detuning.
**Success:** maximum error below 1e−10 at the test sample times, trace error below
1e−9. **Failure:** unexplained loss of norm or incorrect frequency.

This is a standard two-level system labeled as world transfer. It does not
establish that physical universes can be joined by this Hamiltonian.

## 02 — The finite curve

Six worlds form two triangles. Worlds 0–2 are inside; 3–5 outside. Edges 2↔3 and
0↔5 cross the boundary. The mask removes those two edges initially. At t = 5,
the guided sequence opens them. All initial amplitude lies in world 0.

**Ablation:** keep the boundary locked and disable guided events. **Success:**
exterior probability stays below 1e−12 while locked, and exceeds 0.01 after three
units of open evolution in the regression case. **Failure:** pre-opening leakage.

Reclosing the boundary preserves probability already outside; it does not return
the traveler. This finite graph approximates restricted accessibility, not an
actually infinite space or the precise cosmology of the show.

## 03 — The carried record

Four worlds form a ring. At t = 1.5, a controlled gate toggles the bit in world 1.
At t = 4, worlds 1 and 3 are swapped. The record bit also shifts world energies
through η = 0.8, so history can influence later location probabilities.

**Ablation:** disable record gates and set η = 0. **Success:** a world-only swap
preserves the record marginal and global purity to 1e−10 while moving the selected
world populations. **Failure:** the jump resets the bit or changes total trace.

Try **Discard record** after recording. The reduced-world density matrix stays
the same, even though the record returns to zero. This is a concrete distinction
between undoing a reversible interaction and discarding information.

The register stores one binary distinction. Grief and attachment are narrative
interpretations, not quantities measured by this model.

## 04 — Losing the phase

The initial world state is an equal superposition over a four-world ring;
the record is zero. Default γ = 0.35 and κ = 0.55. Dephasing acts on world labels.

**Ablation:** γ = 0. For an exact reference, additionally set κ = 0 and energy
contrast = 0. Then C(t) = exp(−γt) and purity = 1/4 + 3exp(−2γt)/4.
**Success:** agreement within 1e−10 with the reference and unchanged diagonal
populations. **Failure:** probability disappears with coherence.

The density matrix is an ensemble description. The app never samples a particular
world as a measurement result and does not implement objective collapse.

## 05 — The sourced field

A smooth spatial Gaussian and temporal sin² pulse drives the field for three
time units. Source gain = 1, wave speed = 1, damping = 0.06. The domain is periodic.
The quantum panel remains the inert initial state; no quantum field coupling is
used in this experiment.

**Ablation:** source gain = 0. **Success:** the source-free, zero-initial-data
solution remains exactly zero; a source-free Fourier-mode reference converges
at approximately second order when the grid and time step are refined together.
**Failure:** nonzero field without input or loss of the observed convergence rate.

For a resolution comparison use gridPoints = 64, 128, 256 with dt = 0.025,
0.0125, 0.00625 respectively. Those settings are available in the CLI. The default
browser grid is fixed so interactive changes cannot invalidate the record geometry.

## 06 — Worlds with feedback

Six connected worlds source the field according to their probabilities. At t = 2,
world 1 toggles the record. The field shifts subsequent world energies. Defaults:
κ = 0.65, A = 0.6, g = 1.1, ζ = 0.1, η = 0.5.

**Ablation:** g = 0, retaining the probability-to-field source. This isolates the
return path of the feedback rather than simultaneously removing both directions.
**Success:** with g = 0, changing source strength leaves the quantum trajectory
unchanged to 1e−12; with g ≠ 0 the default endpoint differs from the ablation.
**Failure:** the uncoupled quantum trajectory depends on the source amplitude.

The combined scheme is first order in time. A dedicated refinement check compares
dt, dt/2, and dt/4 against a smaller-step trajectory. This model is uncalibrated;
its differences are effects of its stipulated coupling.

## Common run rules

- Slider changes apply on release, before the next simulation step.
- Events scheduled at the same step execute in preset order; imported manual
  interventions at that step execute first.
- Imported files replay initial conditions plus interventions; supplied endpoint
  summaries are not trusted as state input.
- Maximum run length: 20,000 steps. Maximum manual interventions: 2,000.
- Reset restores the selected preset. Export before resetting to keep a run.
- JSON records reproduce the state and event history, not the viewport's rolling
  field heatmap, which is a display-only cache sampled during rendering.
