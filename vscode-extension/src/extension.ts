import * as vscode from 'vscode';
import { ExplanationPanel } from './panel';
import { ProviderConfig } from './types';

let panel: ExplanationPanel | undefined;
let selectionTimer: ReturnType<typeof setTimeout> | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const getConfig = (): ProviderConfig => {
    const config = vscode.workspace.getConfiguration('codeExplain');
    return {
      provider: config.get<'ollama' | 'openai-compatible'>('provider', 'ollama'),
      ollamaBaseUrl: config.get('ollamaBaseUrl', 'http://127.0.0.1:11434'),
      ollamaModel: config.get('ollamaModel', 'qwen2.5-coder:7b'),
      openAICompatibleBaseUrl: config.get('openAICompatibleBaseUrl', 'https://api.openai.com/v1'),
      openAICompatibleModel: config.get('openAICompatibleModel', 'gpt-4o-mini')
    };
  };

  const configure = async (): Promise<void> => {
    const provider = await vscode.window.showQuickPick([
      { label: 'Ollama (local)', value: 'ollama' as const, description: 'Private and free after installing Ollama' },
      { label: 'OpenAI-compatible API', value: 'openai-compatible' as const, description: 'Use your own provider API key' }
    ], { placeHolder: 'Choose how CodeExplain should generate explanations' });
    if (!provider) return;
    await vscode.workspace.getConfiguration('codeExplain').update('provider', provider.value, vscode.ConfigurationTarget.Global);
    if (provider.value === 'openai-compatible') {
      const key = await vscode.window.showInputBox({ prompt: 'Paste your API key (stored in VS Code Secret Storage)', password: true, ignoreFocusOut: true });
      if (key) await context.secrets.store('codeExplain.openAICompatibleApiKey', key);
    } else {
      void vscode.window.showInformationMessage('Ollama selected. Install Ollama, start it, and pull the configured model.');
    }
  };

  panel = new ExplanationPanel(context.extensionUri, context.secrets, getConfig, configure);
  context.subscriptions.push({ dispose: () => panel?.dispose() });
  context.subscriptions.push(vscode.commands.registerCommand('codeExplain.configureProvider', configure));
  context.subscriptions.push(vscode.commands.registerCommand('codeExplain.explainSelection', () => explainActiveSelection(panel!, getConfig)));
  context.subscriptions.push(vscode.commands.registerCommand('codeExplain.exportExplanation', () => panel?.exportExplanation()));
  context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((event) => {
    if (!vscode.workspace.getConfiguration('codeExplain').get('autoExplain', true)) return;
    if (selectionTimer) clearTimeout(selectionTimer);
    selectionTimer = setTimeout(() => void explainActiveSelection(panel!, getConfig, event), 650);
  }));
}

async function explainActiveSelection(
  target: ExplanationPanel,
  getConfig: () => ProviderConfig,
  event?: vscode.TextEditorSelectionChangeEvent
): Promise<void> {
  const editor = event?.textEditor || vscode.window.activeTextEditor;
  const selection = event?.selections[0] || editor?.selection;
  if (!editor || !selection || selection.isEmpty) return;
  const code = editor.document.getText(selection);
  const minimum = vscode.workspace.getConfiguration('codeExplain').get('minimumSelectionCharacters', 20);
  if (code.trim().length < minimum) return;
  await target.explain({
    code,
    language: editor.document.languageId,
    fileName: editor.document.fileName.split(/[\\/]/).pop() || 'untitled'
  });
}

export function deactivate(): void {
  if (selectionTimer) clearTimeout(selectionTimer);
  panel?.dispose();
}
