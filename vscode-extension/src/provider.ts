import * as vscode from 'vscode';
import { buildSystemPrompt, buildUserPrompt } from './prompts';
import { ExplanationRequest, ProviderConfig } from './types';

export async function streamExplanation(
  request: ExplanationRequest,
  config: ProviderConfig,
  secrets: vscode.SecretStorage,
  onToken: (token: string) => void,
  signal: AbortSignal
): Promise<void> {
  if (config.provider === 'ollama') {
    await streamOllama(request, config, onToken, signal);
    return;
  }

  const apiKey = await secrets.get('codeExplain.openAICompatibleApiKey');
  if (!apiKey) {
    throw new Error('No API key is configured. Run “CodeExplain: Configure AI Provider”.');
  }

  await streamOpenAICompatible(request, config, apiKey, onToken, signal);
}

async function streamOllama(
  request: ExplanationRequest,
  config: ProviderConfig,
  onToken: (token: string) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(`${trimSlash(config.ollamaBaseUrl)}/api/chat`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel,
      stream: true,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(request) }
      ],
      keep_alive: config.ollamaKeepAlive,
      options: { temperature: 0.2, num_predict: config.maxOutputTokens, num_ctx: 4096 }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama returned ${response.status}. Is Ollama running with the requested model?`);
  }

  await readJsonLines(response, (value) => {
    const token = typeof value?.message?.content === 'string' ? value.message.content : '';
    if (token) onToken(token);
  });
}

async function streamOpenAICompatible(
  request: ExplanationRequest,
  config: ProviderConfig,
  apiKey: string,
  onToken: (token: string) => void,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(`${trimSlash(config.openAICompatibleBaseUrl)}/chat/completions`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: config.openAICompatibleModel,
      stream: true,
      temperature: 0.2,
      max_tokens: config.maxOutputTokens,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(request) }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`AI provider returned ${response.status}: ${detail.slice(0, 240)}`);
  }

  await readSse(response, (value) => {
    if (value === '[DONE]') return;
    const token = value?.choices?.[0]?.delta?.content;
    if (typeof token === 'string') onToken(token);
  });
}

async function readJsonLines(
  response: Response,
  onValue: (value: any) => void
): Promise<void> {
  if (!response.body) throw new Error('The provider returned an empty response.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try { onValue(JSON.parse(line)); } catch { /* Ignore incomplete provider lines. */ }
    }
    if (done) break;
  }
}

async function readSse(response: Response, onValue: (value: any) => void): Promise<void> {
  if (!response.body) throw new Error('The provider returned an empty response.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const event of events) {
      const data = event.split('\n').find((line) => line.startsWith('data:'))?.slice(5).trim();
      if (!data) continue;
      try { onValue(data === '[DONE]' ? '[DONE]' : JSON.parse(data)); } catch { /* Ignore keep-alives. */ }
    }
    if (done) break;
  }
}

function trimSlash(value: string): string {
  return value.replace(/\/+$/, '');
}
