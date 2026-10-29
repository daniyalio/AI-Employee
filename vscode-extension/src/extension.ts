import * as vscode from 'vscode';
import { ExplanationPanel } from './panel';
import { ProviderConfig, SupportConfig } from './types';

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
      openAICompatibleModel: config.get('openAICompatibleModel', 'gpt-4o-mini'),
      maxOutputTokens: config.get('maxOutputTokens', 512),
      ollamaKeepAlive: config.get('ollamaKeepAlive', '10m')
    };
  };

  const getSupport = (): SupportConfig => {
    const config = vscode.workspace.getConfiguration('codeExplain');
    return {
      buyMeACoffeeUrl: config.get('buyMeACoffeeUrl', ''),
      githubSponsorsUrl: config.get('githubSponsorsUrl', '')
    };
  };

  const openSupport = async (): Promise<void> => {
    const support = getSupport();
    const links = [
      ...(support.buyMeACoffeeUrl ? [{ label: 'Buy Me a Coffee', url: support.buyMeACoffeeUrl }] : []),
      ...(support.githubSponsorsUrl ? [{ label: 'GitHub Sponsors', url: support.githubSponsorsUrl }] : [])
    ];
    if (!links.length) {
      const configured = await vscode.window.showInputBox({
        prompt: 'Paste your Buy Me a Coffee URL (or leave blank to configure it later)',
        placeHolder: 'https://buymeacoffee.com/yourname'
      });
      if (configured) {
        await vscode.workspace.getConfiguration('codeExplain').update('buyMeACoffeeUrl', configured.trim(), vscode.ConfigurationTarget.Global);
        await vscode.env.openExternal(vscode.Uri.parse(configured.trim()));
      }
      return;
    }
    const choice = links.length === 1
      ? links[0]
      : await vscode.window.showQuickPick(links, { placeHolder: 'Choose how to support CodeExplain' });
    if (choice) await vscode.env.openExternal(vscode.Uri.parse(choice.url));
  };

  const maybeShowSupportReminder = async (): Promise<void> => {
    const config = vscode.workspace.getConfiguration('codeExplain');
    if (!config.get('showSupportReminders', true)) return;
    const intervalDays = config.get('supportReminderIntervalDays', 30);
    const lastShown = context.globalState.get<number>('codeExplain.supportReminderShownAt', 0);
    const interval = intervalDays * 24 * 60 * 60 * 1000;
    if (Date.now() - lastShown < interval) return;
    await context.globalState.update('codeExplain.supportReminderShownAt', Date.now());
    const action = await vscode.window.showInformationMessage(
      'CodeExplain is free and maintained independently. If it helps you, you can support development.',
      'Support',
      'Not now'
    );
    if (action === 'Support') await openSupport();
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
      const currentModel = vscode.workspace.getConfiguration('codeExplain').get('ollamaModel', 'qwen2.5-coder:7b');
      const model = await vscode.window.showInputBox({
        prompt: 'Which installed Ollama model should CodeExplain use?',
        value: currentModel,
        placeHolder: 'qwen2.5-coder:7b or llama3.2:3b'
      });
      if (model?.trim()) {
        await vscode.workspace.getConfiguration('codeExplain').update('ollamaModel', model.trim(), vscode.ConfigurationTarget.Global);
      }
      void vscode.window.showInformationMessage('Ollama selected. Smaller models such as llama3.2:3b respond faster; coding models usually explain code more accurately.');
    }
  };

  panel = new ExplanationPanel(context.extensionUri, context.secrets, getConfig, configure, getSupport, openSupport);
  context.subscriptions.push({ dispose: () => panel?.dispose() });
  context.subscriptions.push(vscode.commands.registerCommand('codeExplain.configureProvider', configure));
  context.subscriptions.push(vscode.commands.registerCommand('codeExplain.explainSelection', () => explainActiveSelection(panel!, getConfig)));
  context.subscriptions.push(vscode.commands.registerCommand('codeExplain.exportExplanation', () => panel?.exportExplanation()));
  context.subscriptions.push(vscode.commands.registerCommand('codeExplain.support', openSupport));
  const output = vscode.window.createOutputChannel('CodeExplain');
  output.appendLine('CodeExplain is free. Use CodeExplain: Support This Project if it saves you time.');
  context.subscriptions.push(output);
  void maybeShowSupportReminder();
  context.subscriptions.push(vscode.window.onDidChangeTextEditorSelection((event) => {
    if (!vscode.workspace.getConfiguration('codeExplain').get('autoExplain', true)) return;
    if (selectionTimer) clearTimeout(selectionTimer);
    const delay = vscode.workspace.getConfiguration('codeExplain').get('selectionDelayMs', 400);
    selectionTimer = setTimeout(() => void explainActiveSelection(panel!, getConfig, event), delay);
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
