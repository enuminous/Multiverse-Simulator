# Formal coverage

## Frozen target

Source: [`docs/EQUATIONS.md`](../docs/EQUATIONS.md), baseline commit `cd8374de34d8f7e19b7c2a431dec07be1b97fd80`.
The definitions and theorem hypotheses in `Quantum.lean` are the acceptance target.
The pinned Lean/Mathlib build and strict axiom audit must pass before treating a
statement as machine-checked. The workflow records the exact tested commit/run.

## Statements covered

Finite Kraus maps preserve positive semidefiniteness; their completeness equation implies trace preservation. Unitary conjugation and convex dephasing preserve density matrices under explicit algebraic hypotheses. The exponential damping weight lies in [0,1], and repeated density-preserving steps remain valid.

## Limits and unresolved obligations

The completeness and unitarity equations are explicit hypotheses for the supplied matrices. Instantiating every JavaScript Hamiltonian/projector/reset matrix, proving matrix-exponential unitarity, complete positivity under arbitrary ancillary extensions, partial-trace reset and floating-point error bounds remain separate obligations. No multiverse ontology or experimental quantum claim follows.

## Evidence discipline

These are established algebra, analysis and finite-dimensional mathematics,
not a novelty claim. Formal proofs establish only their stated hypotheses and
conclusions. Computational regression tests are software checks, not independent
experimental evidence. No theorem uses a claimed physical interpretation as a
premise. No custom axioms, `sorry`, or native-evaluation trust exception is allowed.
No new animal operation is invented or claimed to have been executed.

The first evidence status is **unresolved** until the exact-commit workflow
succeeds; thereafter only the covered formal statements are **demonstrated**.
Scientific applicability remains a **hypothesis/postulate** unless separately tested.
