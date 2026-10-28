import * as vscode from 'vscode';
import { streamExplanation } from './provider';
import { ExplanationRequest, ProviderConfig, SupportConfig } from './types';

export class ExplanationPanel {
  private panel?: vscode.WebviewPanel;
  private currentAbort?: AbortController;
  private latestRequest?: ExplanationRequest;
  private latestExplanation = '';

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly secrets: vscode.SecretStorage,
    private readonly getConfig: () => ProviderConfig,
    private readonly onConfigure: () => Promise<void>,
    private readonly getSupport: () => SupportConfig,
    private readonly onSupport: () => Promise<void>
  ) {}

  async explain(request: ExplanationRequest): Promise<void> {
    this.latestRequest = request;
    this.latestExplanation = '';
    this.currentAbort?.abort();
    this.currentAbort = new AbortController();
    this.ensurePanel();
    this.post({ type: 'start', request });

    try {
      await streamExplanation(
        request,
        this.getConfig(),
        this.secrets,
        (token) => {
          this.latestExplanation += token;
          this.post({ type: 'token', token });
        },
        this.currentAbort.signal
      );
      this.post({ type: 'done' });
    } catch (error) {
      if ((error as Error).name === 'AbortError') return;
      this.post({ type: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }

  async followUp(question: string): Promise<void> {
    if (!this.latestRequest || !question.trim()) return;
    await this.explain({ ...this.latestRequest, question: question.trim() });
  }

  async exportExplanation(): Promise<void> {
    if (!this.latestExplanation) {
      void vscode.window.showInformationMessage('There is no completed explanation to export yet.');
      return;
    }
    const file = this.latestRequest?.fileName || 'selected-code';
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file(`${file.replace(/[^a-z0-9._-]/gi, '_')}-explanation.md`),
      filters: { Markdown: ['md'] },
      saveLabel: 'Export Explanation'
    });
    if (!uri) return;
    void vscode.workspace.fs.writeFile(uri, Buffer.from(`# Code explanation\n\n${this.latestExplanation}\n`));
    void vscode.window.showTextDocument(uri);
  }

  dispose(): void {
    this.currentAbort?.abort();
    this.panel?.dispose();
  }

  private ensurePanel(): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
      return;
    }
    this.panel = vscode.window.createWebviewPanel(
      'codeExplain',
      'CodeExplain',
      vscode.ViewColumn.Beside,
      { enableScripts: true, retainContextWhenHidden: true, localResourceRoots: [this.extensionUri] }
    );
    this.panel.webview.html = this.html(this.panel.webview);
    this.panel.onDidDispose(() => { this.panel = undefined; });
    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'followUp') void this.followUp(String(message.question || ''));
      if (message.type === 'configure') void this.onConfigure();
      if (message.type === 'export') void this.exportExplanation();
      if (message.type === 'stop') this.currentAbort?.abort();
      if (message.type === 'support') void this.onSupport();
    });
  }

  private post(message: unknown): void {
    void this.panel?.webview.postMessage(message);
  }

  private html(webview: vscode.Webview): string {
    const nonce = Math.random().toString(36).slice(2);
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    const support = this.getSupport();
    const supportLink = support.buyMeACoffeeUrl || support.githubSponsorsUrl
      ? `<a href="#" id="support">Support this free tool ☕</a>`
      : `<button id="support">Set up support link</button>`;
    return `<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${csp}"><style>
      body{font-family:var(--vscode-font-family);color:var(--vscode-foreground);background:var(--vscode-editor-background);padding:16px;line-height:1.5}
      .muted{color:var(--vscode-descriptionForeground);font-size:12px}.toolbar{display:flex;gap:8px;margin:12px 0}button{color:var(--vscode-button-foreground);background:var(--vscode-button-background);border:0;padding:6px 10px;border-radius:3px;cursor:pointer}button:hover{background:var(--vscode-button-hoverBackground)}
      #answer{white-space:pre-wrap;overflow-wrap:anywhere}.error{color:var(--vscode-errorForeground)}textarea{box-sizing:border-box;width:100%;min-height:70px;color:var(--vscode-input-foreground);background:var(--vscode-input-background);border:1px solid var(--vscode-input-border);padding:8px}.support{margin-top:18px;padding-top:10px;border-top:1px solid var(--vscode-panel-border);font-size:12px}.support a{color:var(--vscode-textLink-foreground)}
    </style></head><body><h2>CodeExplain</h2><div id="context" class="muted">Select code to begin.</div><div class="toolbar"><button id="stop">Stop</button><button id="export">Export Markdown</button><button id="configure">Configure</button></div><article id="answer"></article><div id="status" class="muted"></div><hr><textarea id="question" placeholder="Ask a follow-up question..."></textarea><div class="toolbar"><button id="ask">Ask</button></div><div class="support">${supportLink}</div><script nonce="${nonce}">
      const vscode=acquireVsCodeApi();const answer=document.getElementById('answer');const context=document.getElementById('context');const status=document.getElementById('status');const question=document.getElementById('question');
      document.getElementById('ask').onclick=()=>{if(question.value.trim())vscode.postMessage({type:'followUp',question:question.value});question.value=''};document.getElementById('stop').onclick=()=>vscode.postMessage({type:'stop'});document.getElementById('export').onclick=()=>vscode.postMessage({type:'export'});document.getElementById('configure').onclick=()=>vscode.postMessage({type:'configure'});document.getElementById('support').onclick=e=>{e.preventDefault();vscode.postMessage({type:'support'})};question.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')document.getElementById('ask').click()});
      window.addEventListener('message',e=>{const m=e.data;if(m.type==='start'){answer.textContent='';context.textContent=(m.request.language||'code')+' · '+(m.request.fileName||'untitled');status.textContent='Generating...'}if(m.type==='token'){answer.textContent+=m.token;status.textContent=''}if(m.type==='done')status.textContent='Complete.';if(m.type==='error'){status.textContent=m.message;status.className='error'}});
    </script></body></html>`;
  }
}
