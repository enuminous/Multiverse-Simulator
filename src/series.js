(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.EFMWSeries = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return [
    {
      id: 'portal', number: '01', title: 'Portal oscillations', category: 'UNITARY DYNAMICS',
      subtitle: 'One traveler. Two possible worlds.',
      description: 'Watch probability flow through a reversible connection. A portal is a coupling in a Hamiltonian; the traveler is a quantum state on the world graph.',
      equation: 'i ∂ₜ ψₐ = εₐ ψₐ + κ ∑ᵦ Aₐᵦ ψᵦ',
      question: 'Does the transfer follow sin²(κt), and does total probability stay at one?',
      observe: 'Set portal strength to zero to stop transfer. With zero detuning the oscillation period of the probabilities is π/κ.',
      status: 'Established two-state mathematics · fictional world labels',
      worlds: 2, edges: [[0, 1]], energies: [0, 1], boundary: 1,
      config: { coupling: 0.8, detuning: 0 }, schedule: [],
      ablation: { name: 'Portals removed', patch: { coupling: 0 } },
      controls: ['coupling', 'detuning'], field: false
    },
    {
      id: 'curve', number: '02', title: 'The finite curve', category: 'CONSTRAINED CONNECTIVITY',
      subtitle: 'A boundary around a piece of infinity.',
      description: 'A six-world approximation to a restricted multiverse. Three worlds sit inside the boundary; the remaining three become reachable when its links open.',
      equation: 'Kₐᵦ = κ Aₐᵦ · Bₐᵦ     |     Bₐᵦ ∈ {0, 1}',
      question: 'Is exterior probability exactly zero while every boundary link is closed?',
      observe: 'The guided sequence opens the boundary at t = 5. Watch exterior probability start to grow. Reclosing the curve does not return probability already outside.',
      status: 'Graph constraint · narrative analogy to the Central Finite Curve',
      worlds: 6, edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3], [0, 5]],
      energies: [0, 0.1, -0.1, 0.15, -0.15, 0], boundary: 3,
      config: { coupling: 0.85, curveLocked: true },
      schedule: [{ time: 5, action: { type: 'parameters', values: { curveLocked: false } }, label: 'Boundary links opened' }],
      ablation: { name: 'Boundary stays closed', patch: { scripted: false, curveLocked: true } },
      controls: ['coupling', 'detuning'], field: false
    },
    {
      id: 'memory', number: '03', title: 'The carried record', category: 'WORLD × MEMORY',
      subtitle: 'Change the world. Keep the history.',
      description: 'Give the traveler a single memory bit. A world-controlled gate records a visit; a later world swap moves the traveler without resetting that bit.',
      equation: 'ℋ = ℂᴺ ⊗ ℂ²     |     Ujump = Pworld ⊗ Irecord',
      question: 'Can the location change while the probability of a recorded bit remains unchanged?',
      observe: 'At t = 1.5 world 1 toggles the bit. At t = 4 worlds 1 and 3 swap. Global purity can remain one while reduced-world purity falls because the record carries correlations.',
      status: 'Quantum information toy model · one bit is not human memory',
      worlds: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]], energies: [0, 0.1, -0.15, 0.15], boundary: 2,
      config: { coupling: 0.7, memoryBias: 0.8 },
      schedule: [
        { time: 1.5, action: { type: 'record', world: 1 }, label: 'World 1 toggled the record bit' },
        { time: 4, action: { type: 'swap', a: 1, b: 3 }, label: 'Worlds 1 and 3 swapped; record carried' }
      ],
      ablation: { name: 'Record interaction removed', patch: { recordEnabled: false, memoryBias: 0 } },
      controls: ['coupling', 'memoryBias', 'dephasing'], field: false
    },
    {
      id: 'decoherence', number: '04', title: 'Losing the phase', category: 'OPEN QUANTUM SYSTEM',
      subtitle: 'Possibilities persist. Interference fades.',
      description: 'Start in an equal superposition and couple the world label to an unobserved environment. Dephasing reduces off-diagonal coherence without deleting probability.',
      equation: 'ρ̇ = −i[H,ρ] + γ(∑ₐ PₐρPₐ − ρ)',
      question: 'Does coherence decay as exp(−γt) when the Hamiltonian is switched off?',
      observe: 'Compare with γ = 0. Purity and coherence are different measurements; dephasing is not a sampled collapse or a deletion of worlds.',
      status: 'Completely positive dephasing channel · no collapse claim',
      worlds: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]], energies: [0, 0.1, -0.15, 0.15], boundary: 2,
      initial: 'uniform', config: { coupling: 0.55, dephasing: 0.35 }, schedule: [],
      ablation: { name: 'Environment removed', patch: { dephasing: 0 } },
      controls: ['coupling', 'dephasing', 'detuning'], field: false
    },
    {
      id: 'field', number: '05', title: 'The sourced field', category: 'EFMW-STYLE CONTINUUM',
      subtitle: 'A local disturbance. A traveling response.',
      description: 'Evolve a normalized scalar source equation on a periodic one-dimensional domain. A smooth three-unit source pulse launches waves, which damping can attenuate.',
      equation: '∂ₜ²φ + 2ζ ∂ₜφ − c² ∂ₓ²φ = −S(x,t)',
      question: 'Do waves propagate at the selected speed, and do finer grids approach the same solution?',
      observe: 'The source ends at t = 3. With periodic boundaries a pulse eventually wraps around the domain. The sign of the forcing follows the rearranged EFMW source template.',
      status: 'Classical, normalized wave equation · EFMW interpretation is a hypothesis',
      worlds: 4, edges: [[0, 1], [1, 2], [2, 3], [3, 0]], energies: [0, 0, 0, 0], boundary: 2,
      config: { coupling: 0, sourceGain: 1, damping: 0.06, fieldEnabled: true }, schedule: [],
      ablation: { name: 'Source removed', patch: { sourceGain: 0 } },
      controls: ['sourceGain', 'damping', 'waveSpeed'], field: true
    },
    {
      id: 'feedback', number: '06', title: 'Worlds with feedback', category: 'EXPERIMENTAL HYBRID',
      subtitle: 'The traveler shapes the field that shapes the journey.',
      description: 'World probabilities source a classical scalar field. The field shifts world energies, feeding back into subsequent quantum transport. Turn that return coupling off to isolate its effect.',
      equation: 'Hₐₐ ← Hₐₐ + gφ(xₐ)     |     S(x,t) = A ∑ₐ pₐ(t) G(x−xₐ)',
      question: 'How much does transport change when the field-to-world feedback coefficient g is zero?',
      observe: 'This explicit hybrid uses the previous quantum populations as the field source. It conserves quantum trace, but is not a closed quantum field theory or a proof of emergence.',
      status: 'EFMW-inspired coupling postulate · uncalibrated hybrid experiment',
      worlds: 6, edges: [[0, 1], [1, 2], [2, 0], [3, 4], [4, 5], [5, 3], [2, 3], [0, 5]],
      energies: [0, 0.1, -0.1, 0.15, -0.15, 0], boundary: 3,
      config: { coupling: 0.65, sourceGain: 0.6, feedbackGain: 1.1, damping: 0.1, fieldEnabled: true, memoryBias: 0.5 },
      schedule: [{ time: 2, action: { type: 'record', world: 1 }, label: 'World 1 toggled the record bit' }],
      ablation: { name: 'Field feedback removed', patch: { feedbackGain: 0 } },
      controls: ['coupling', 'sourceGain', 'feedbackGain', 'damping', 'memoryBias'], field: true
    }
  ];
});
