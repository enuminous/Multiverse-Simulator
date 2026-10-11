(function () {
  'use strict';
  const S = window.EFMWStory, $ = id => document.getElementById(id);
  let dossier, script;
  const status = (text, error = false) => { $('writerStatus').textContent = text; $('writerStatus').classList.toggle('writer-error', error); };
  function save(text, name, type) {
    const url = URL.createObjectURL(new Blob([text], { type })), a = document.createElement('a');
    a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  function guarded(fn) { try { fn(); } catch (e) { status(e.message, true); } }
  function showEvidence() {
    const target = $('sceneEvidence'); target.replaceChildren();
    if (!script) return;
    const scene = script.scenes[Number($('sceneSelect').value)];
    for (const id of scene.beat_ids) {
      const beat = dossier.beats.find(b => b.id === id), p = document.createElement('p');
      p.textContent = id + ' · t = ' + beat.time + ' · ' + (beat.actions.map(a => a.message).join('; ') || 'Measured checkpoint') +
        '. Exterior weight ' + beat.metrics.outside.toFixed(6) + '; record P(1) ' + beat.metrics.record.toFixed(6) +
        '; coherence ' + beat.metrics.coherence.toFixed(6) + '; field energy ' + beat.metrics.fieldEnergy.toFixed(6) + '.';
      target.append(p);
    }
    for (const invention of scene.inventions) { const p = document.createElement('p'); p.className = 'fiction-note'; p.textContent = 'Fictional bridge: ' + invention; target.append(p); }
  }
  function display(next, origin) {
    const checks = S.validate(next, dossier); script = next;
    $('scriptTitle').textContent = script.title; $('scriptLogline').textContent = script.logline;
    $('scriptBody').textContent = S.fountain(script, dossier);
    $('scriptMeta').textContent = checks.scenes + ' scenes · ' + checks.wordCount.toLocaleString() + ' words · ' + dossier.runId + ' · ' + origin;
    $('sceneSelect').replaceChildren();
    script.scenes.forEach((scene, i) => { const o = document.createElement('option'); o.value = i; o.textContent = (i + 1) + '. ' + scene.act + ' / ' + scene.heading; $('sceneSelect').append(o); });
    $('episodeResult').hidden = false; $('writerFountain').disabled = false; showEvidence();
    status('Script loaded. Evidence checks cover references and structure; prose still needs editorial review.');
  }
  function activate(d, label) {
    dossier = d; script = null; $('episodeResult').hidden = true; $('writerFountain').disabled = true;
    $('writerContext').textContent = label + ' · ' + d.experiment + ' · t = ' + d.duration + ' · ' + d.beats.length + ' evidence beats';
    for (const id of ['writerPrompt', 'writerRun', 'writerImport']) $(id).disabled = false;
  }
  $('writerSample').addEventListener('click', () => guarded(() => {
    const sample = window.EFMWEpisodeSample;
    activate(sample.dossier, 'Included sample scenario'); display(sample.script, 'authored here from this run; no API call');
  }));
  $('writerCapture').addEventListener('click', () => guarded(() => {
    activate(S.dossier(window.EFMWLab.snapshot()), 'Snapshot of your paused experiment');
    status('Run captured. Download the prompt for an LLM, or the replay JSON for the API command. Import the returned script JSON here.');
  }));
  $('writerPrompt').addEventListener('click', () => guarded(() => save(S.prompt(dossier, $('writerPremise').value), 'efmw-episode-prompt.txt', 'text/plain')));
  $('writerRun').addEventListener('click', () => guarded(() => save(JSON.stringify(dossier.source, null, 2), 'efmw-episode-run.json', 'application/json')));
  $('writerFountain').addEventListener('click', () => guarded(() => save(S.fountain(script, dossier), 'efmw-episode.fountain', 'text/plain')));
  $('writerImport').addEventListener('click', () => $('writerFile').click());
  $('writerFile').addEventListener('change', async () => {
    const file = $('writerFile').files[0]; if (!file) return;
    try {
      if (file.size > 1024 * 1024) throw new Error('Script JSON must be under 1 MiB.');
      const parsed = JSON.parse(await file.text()); display(parsed, 'imported script; authorship not independently verified');
    } catch (e) { status(e.message, true); } finally { $('writerFile').value = ''; }
  });
  $('sceneSelect').addEventListener('change', showEvidence);
})();
