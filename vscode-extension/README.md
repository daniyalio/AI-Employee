# CodeExplain VS Code Extension

CodeExplain automatically explains selected code in a side panel. It supports:

- Local Ollama models (no cloud AI bill and source stays local).
- Your own API key for an OpenAI-compatible provider.
- Automatic explanation when a selection remains stable.
- Follow-up questions.
- Markdown export.

## Run locally

1. Install Node.js and VS Code.
2. From this directory run `npm install`.
3. Run `npm run compile`.
4. Open this folder in VS Code.
5. Press `F5` to launch an Extension Development Host.
6. Run `CodeExplain: Configure AI Provider` from the Command Palette.

## Ollama

Install Ollama, start it, and pull a coding model, for example:

```bash
ollama pull qwen2.5-coder:7b
```

The extension defaults to `http://127.0.0.1:11434` and `qwen2.5-coder:7b`. Change these in VS Code settings if needed.

## Security and privacy

- API keys are stored in VS Code Secret Storage, not settings files.
- Ollama requests stay on the local machine.
- The extension does not store source code or conversation history by default.
- OpenAI-compatible providers receive selected code because the user explicitly configured that provider.

## Current scope

This is the zero-cost individual MVP. Authentication, paid tiers, team workspaces, cloud history, and billing are intentionally not included until the local workflow is validated.
