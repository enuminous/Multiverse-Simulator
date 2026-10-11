# Saved default experiments

Generated with engine 1.0.0. Each run uses default settings and 320 steps (t = 8).

Import any `*-run.json` into the browser, or pass it to the CLI with `--replay`. The matching CSV contains sampled measurements. `comparisons.json` preserves all six full/ablated endpoint pairs.

| Experiment | Trace error | World coherence | Record P(1) | Field energy | Ablation distance |
|---|---:|---:|---:|---:|---:|
| portal | 1.23e-14 | 0.231510 | 0.000000 | 0.000000 | 0.013584 |
| curve | 2.78e-14 | 0.933496 | 0.000000 | 0.000000 | 0.609689 |
| memory | 6.46e-14 | 0.638474 | 0.186795 | 0.000000 | 0.128552 |
| decoherence | 1.38e-13 | 0.062083 | 0.000000 | 0.000000 | 0.059508 |
| field | 0.00e+00 | 0.000000 | 0.000000 | 0.438446 | 0.000000 |
| feedback | 2.40e-14 | 0.725638 | 0.229138 | 0.398855 | 0.177749 |

Ablation distance is total variation of world probabilities. It is zero in the field-only experiment because that experiment intentionally leaves the quantum state unchanged; compare field energy instead. Numeric precision in this table does not imply equivalent physical or discretization accuracy.

`reference-validation.json` records the independent NumPy and refinement checks. These outputs are simulations of specified assumptions, not empirical measurements.
