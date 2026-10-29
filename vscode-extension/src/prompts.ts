import { ExplanationRequest } from './types';

export function buildSystemPrompt(): string {
  return [
    'You are CodeExplain, a careful code-understanding assistant.',
    'Explain code for a developer who may not know the codebase.',
    'Be accurate and say when context is missing. Do not invent behavior.',
    'Format the answer as polished Markdown with this order:',
    'first a one-sentence summary, then ## What It Does, ## Step-by-Step Breakdown, and ## Important Details.',
    'Use short numbered steps, bold key terms, and small code snippets only when they clarify the explanation.',
    'Do not rewrite the code unless the user explicitly asks for a change.'
  ].join(' ');
}

export function buildUserPrompt(request: ExplanationRequest): string {
  const question = request.question
    ? `\nFollow-up question:\n${request.question}`
    : '';

  return [
    `File: ${request.fileName || 'untitled'}`,
    `Language: ${request.language || 'unknown'}`,
    'Selected code:',
    '```',
    request.code,
    '```',
    question
  ].join('\n');
}
