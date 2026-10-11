/* Node-only adapter. Credentials never enter the static browser application. */
'use strict';
const Story = require('./story.js');
const ENDPOINT = 'https://api.openai.com/v1/responses';
async function generateEpisode(dossier, options = {}) {
  const key = options.apiKey || process.env.OPENAI_API_KEY;
  const model = options.model || process.env.OPENAI_MODEL;
  if (!key) throw new Error('Set OPENAI_API_KEY in your shell before using the OpenAI provider.');
  if (!model || typeof model !== 'string' || model.length > 200) throw new Error('Set OPENAI_MODEL or pass --model with a Responses model that supports Structured Outputs.');
  const maxTokens = options.maxTokens ?? 16000;
  if (!Number.isInteger(maxTokens) || maxTokens < 1024 || maxTokens > 32000) throw new Error('maxTokens must be an integer from 1,024 to 32,000.');
  const send = options.fetchImpl || globalThis.fetch;
  let response;
  try {
    response = await send(ENDPOINT, {
      method: 'POST', headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, store: false, max_output_tokens: maxTokens,
        instructions: Story.instructions, input: Story.prompt(dossier, options.premise || ''),
        text: { format: { type: 'json_schema', name: 'efmw_episode', strict: true, schema: Story.scriptSchema } } }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 240000)
    });
  } catch (err) {
    if (err.name === 'TimeoutError' || err.name === 'AbortError') throw new Error('LLM request timed out. No automatic retry was made.');
    throw new Error('Could not connect to the OpenAI Responses API. No automatic retry was made.');
  }
  if (!response.ok) throw new Error('OpenAI API returned HTTP ' + response.status + '. Check your model, credentials, quota, and request limits. No automatic retry was made.');
  let body;
  try { body = await response.json(); } catch { throw new Error('OpenAI returned a non-JSON response.'); }
  const content = (body.output || []).filter(x => x.type === 'message').flatMap(x => x.content || []);
  if (content.some(x => x.type === 'refusal')) throw new Error('The model declined to generate this episode.');
  if (body.status !== 'completed') throw new Error('LLM response was not completed (' + String(body.status) + '). Increase the output budget if truncated. No partial script was accepted.');
  const raw = content.filter(x => x.type === 'output_text').map(x => x.text).join('');
  if (!raw || raw.length > 300000) throw new Error('Missing or oversized script response.');
  let script;
  try { script = JSON.parse(raw); } catch { throw new Error('The model returned invalid episode JSON.'); }
  const checks = Story.validate(script, dossier);
  return { script, checks, provenance: { method: 'openai-responses', model: body.model || model,
    responseId: body.id || null, usage: body.usage || null, generatedAt: new Date().toISOString(), liveApiCall: true } };
}
module.exports = { ENDPOINT, generateEpisode };
