import { ExplanationRequest } from './types';

export function buildSystemPrompt(): string {
  return [
    'You are CodeExplain, a careful code-understanding assistant.',
    'Explain code for a developer who may not know the codebase.',
    'Be accurate and say when context is missing. Do not invent behavior.',
    'Use Markdown with these sections when applicable:',
    'Purpose, How it works, Important details, Risks or edge cases, and Example.',
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
