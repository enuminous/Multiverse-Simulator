# Claims and evidence boundaries

## Frozen target

Version 1.0.0 implements six finite experiments specified in `src/series.js`
and `docs/EQUATIONS.md`. Acceptance thresholds are fixed in the tests. The target
is implementation correctness relative to those models, not proof that a fictional
universe or a physical theory follows from them.

## Evidence ledger

| Claim | Status | Basis / limit |
|---|---|---|
| The two-level solver reproduces Rabi transfer | Demonstrated numerically | Independent analytic formula; default and detuned cases |
| Hermitian finite-world evolution preserves quantum probability | Established mathematically; numerically checked | Unitary conjugation; floating-point trace diagnostics |
| Closed graph links prevent transport across the selected boundary | Demonstrated within model | Block-diagonal Hamiltonian and leakage regression |
| A world-only permutation preserves the memory marginal | Established mathematically; numerically checked | Partial trace is invariant under a world-only unitary |
| A record can reduce world purity while global purity stays one | Demonstrated within model | Controlled gate on a pure joint state |
| Dephasing reduces coherence without reducing trace | Established channel; numerically checked | Convex mixture of identity and projective dephasing |
| The normalized wave solver approximates its specified PDE | Supported by bounded numerical checks | Exact zero solution, Fourier reference, refinement and damping tests |
| Feedback alters a default finite trajectory | Demonstrated within the chosen postulate | Parameter ablation and recorded endpoint differences |
| The feedback rule is a physical EFMW coupling | Hypothesis/postulate | No derivation or empirical calibration supplied |
| The supplied scalar template has a unique physical meaning | Unresolved | E, P, φ, source law, scales and boundary data require physical definitions |
| These equations describe all Rick and Morty episodes | Not established | A narrative interpretation cannot determine unspecified plot choices |
| This demonstrates portals, AGI, consciousness, a new force, or human memory | Rejected as an inference from this package | None is measured or derived here |

## Audit operations actually performed

These are explicit numerical gates, **not invented Zoo animal operations**.
No claim that this release has passed a complete named Monolithic Zoo audit is
made. Canonical operation definitions and additional inputs would be needed for
that separate process.

| Operation | Input → output | Fixed criterion |
|---|---|---|
| Analytic dynamics comparison | H, initial state → p(t) | Two-state and dephasing errors < 1e−10 |
| State-invariant check | All default trajectories → trace, Hermiticity, PSD | Trace < 1e−9; Hermiticity < 1e−10; minimum eigenvalue > −1e−10 |
| Boundary falsification | Locked graph → exterior probability | Leakage < 1e−12 |
| Memory intervention check | Before/after swap or discard → reduced states | Invariant differences < 1e−10 |
| PDE refinement check | Fourier mode on three grids → error ratios | Successive ratios > 3.5 |
| Mechanism ablation | Full / disabled mechanism → endpoint measurements | All runs retained, including zero differences |
| Replay check | Exported instructions → reconstructed state | State agreement < 1e−13 on the same runtime |

Actual executed outcomes, independent cross-checks, and remaining UI verification
are in [VALIDATION.md](VALIDATION.md).

## Anti-circularity and independence

- The two-level and dephasing formulas are derived independently of the engine.
- The wave reference is a known Fourier solution, not a curve fitted to output.
- Browser and CLI share an engine. Agreement between them is reproducibility,
  **not independent validation**.
- The independent NumPy reference checks the Hamiltonian exponential and state
  eigenvalues using a separate linear-algebra implementation. It still tests the
  same assumed Hamiltonian, not whether that Hamiltonian describes nature.
- The internal positivity check shares the Jacobi routine with the propagator;
  it is supplemented by the NumPy check rather than counted as independent evidence.
- All six default results and ablations are preserved in `examples/`; no favorable
  trajectory was selected to support a physical conclusion.
- Feedback effects follow from introducing the coupling. Their existence cannot
  independently justify introducing that coupling in the first place.

## Novelty check

| Ingredient | Relation to known work |
|---|---|
| Coupled world amplitudes | Relabeling of finite Hamiltonian/continuous quantum-walk dynamics |
| One-bit portable record | Standard tensor-product state and controlled gate |
| Dephasing | Standard completely positive quantum channel |
| Forced scalar wave equation | Standard linear PDE structure; EFMW source interpretation remains separate |
| Explicit quantum/classical feedback | Adjacent to hybrid/mean-field modeling; this particular choice is a proposed toy rule |
| Rick-and-Morty narrative mapping | Creative interpretation, not a mathematical novelty claim |

## Unresolved obligations

1. Define physical dimensions, observables, scales and sources for E, P and φ.
2. Derive or independently justify the hybrid coupling, including its energy budget.
3. Address causality, relativistic covariance, no-signaling and quantum/classical
   consistency before treating the hybrid as a candidate physical theory.
4. Replace the memory bit with an operationally defined record model if richer
   narrative questions are studied; do not simply rename the bit “consciousness.”
5. Calibrate on actual data and preregister held-out predictions for any empirical claim.
6. Conduct a real browser/device usability check before asserting broad UI compatibility.

## Minimal next scientific step

Choose an independently measured, dimensionally defined system that could support
the proposed field feedback. Freeze a source calibration and predict a held-out
observable against a no-feedback baseline. Set a numerical effect threshold and
failure condition **before** observing the data. Without such a target, further
simulation explores a model but cannot validate the physical interpretation.

## Narrative generator extension (1.1)

An LLM conditions on an executed simulation dossier and an author premise to produce fictional scenes. Characters, dialogue, motives, material damage, and individual travel paths are creative additions. No individual quantum trajectory is sampled. The source equation does not determine moral consequences or the television story. The validator checks JSON structure and source-reference coverage, not semantic truth. The included sample was assistant-authored from executed data; live API generation was not performed.
