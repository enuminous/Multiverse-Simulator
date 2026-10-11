# Sources and provenance

## Origin of this project

Matthew Chenoweth Wright requested a GitHub-ready simulator series under EFMW
Physics on October 11, 2026, following a discussion of an equation for the entire
Rick-and-Morty narrative rather than an equation displayed in an episode.

The conversation's proposed architecture was
`iℏ ∂t Ψa = Ha Ψa + Σb≠a Kab Ψb`, with state dependence on world configurations
and memory records. The finite operators and numerical experiments in this
release were constructed for that request; they are not taken from the show.

The scalar template
`∇²φ − c⁻² ∂t²φ = (4π/c²)(E + cP)` was provided in the EFMW project context.
It is treated as an input expression. A canonical public equation-index file
was not independently retrieved in this task, and the package does not invent a
repository citation or physical definition for its symbols.

## Primary mathematical background

1. **David Tong, Lectures on Quantum Field Theory.** Field configurations,
   canonical quantization, and the distinction between a quantum state and a
   field configuration. This supports the conceptual starting point, not the
   fictional portal terms.
   https://www.damtp.cam.ac.uk/user/tong/qft.htm
   https://www.damtp.cam.ac.uk/user/tong/qft/two.pdf

2. **John Preskill, Quantum Information and Computation, Caltech course notes.**
   Density matrices, composite quantum systems, quantum channels, and decoherence.
   https://www.preskill.caltech.edu/ph229/

3. **Jacob Biamonte, Lectures on Quantum Tensor Networks**, arXiv:1912.10049.
   Context for the earlier discussion of graphical quantum mathematics. Tensor
   networks are not used as the numerical representation in this implementation.
   https://arxiv.org/abs/1912.10049

The matrix exponential, controlled gate, partial trace, dephasing channel, and
wave discretization are specified directly in `EQUATIONS.md`; no proprietary
simulation engine or copied library source is included.

## Narrative context

- Adult Swim, **Inside the Episode: Rickmurai Jack** — official production
  context for the season-five multiverse story.
  https://www.adultswim.com/videos/rick-and-morty/inside-the-episode-rickmurai-jack
- Jacob Biamonte, **Snake Equation Appears on Rick and Morty** — confirms the
  genuine tensor-network identity in the earlier, distinct on-screen example.
  https://profs.etsmtl.ca/jbiamonte/news/snake-equation-tensor-networks.html

These sources do not supply or endorse an EFMW field equation for the show.
World accessibility and persistent records are our interpretive modeling choices.

## Deployment references

GitHub's official Pages documentation and action repositories were checked on
October 11, 2026:

- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://github.com/actions/checkout
- https://github.com/actions/setup-node
- https://github.com/actions/upload-pages-artifact
- https://github.com/actions/deploy-pages

External links are references only. The simulator makes no network requests.

## Episode writer API (1.1)

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), official Responses API guide, consulted October 11, 2026. Used for `text.format` JSON Schema, refusal detection, and incomplete-response handling.

The original fan screenplay was authored in this conversation from the included numerical dossier. No television transcript was used as a source.
