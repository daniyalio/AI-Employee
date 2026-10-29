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
      await streamExplanation(request, this.getConfig(), this.secrets, (token) => {
        this.latestExplanation += token;
        this.post({ type: 'token', token });
      }, this.currentAbort.signal);
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
    await vscode.workspace.fs.writeFile(uri, Buffer.from(`# Code explanation\n\n${this.latestExplanation}\n`));
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
    this.panel = vscode.window.createWebviewPanel('codeExplain', 'AI Chat', vscode.ViewColumn.Beside, {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [this.extensionUri]
    });
    this.panel.webview.html = this.html();
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

  private html(): string {
    const nonce = Math.random().toString(36).slice(2);
    const csp = `default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';`;
    const support = this.getSupport();
    const supportLink = support.buyMeACoffeeUrl || support.githubSponsorsUrl
      ? '<a href="#" id="support">Support this free tool ☕</a>'
      : '<button id="support" class="link-button">Set up support link</button>';

    return `<!doctype html>
<html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${csp}">
<style>
  body{margin:0;padding:0;color:var(--vscode-foreground);background:var(--vscode-editor-background);font-family:var(--vscode-font-family);line-height:1.55}
  .shell{min-height:100vh;display:flex;flex-direction:column}.topbar{height:54px;display:flex;align-items:center;justify-content:space-between;padding:0 20px;border-bottom:1px solid var(--vscode-panel-border);background:var(--vscode-sideBar-background)}
  .brand{display:flex;align-items:center;gap:10px}.logo{display:grid;place-items:center;width:28px;height:28px;border-radius:7px;background:var(--vscode-button-background);color:var(--vscode-button-foreground);font-weight:700}.title{font-size:14px;font-weight:700}.subtle{font-size:11px;color:var(--vscode-descriptionForeground)}.top-actions{display:flex;align-items:center;gap:8px}.top-actions button{padding:4px 7px;background:transparent;border:0;color:var(--vscode-descriptionForeground)}
  .body{padding:22px 24px 150px;max-width:850px;width:100%;box-sizing:border-box;margin:0 auto}.eyebrow{font-size:11px;color:var(--vscode-descriptionForeground);text-transform:uppercase;letter-spacing:.08em}.main-title{font-size:26px;line-height:1.2;margin:7px 0 10px;letter-spacing:-.02em}.summary{font-size:15px;margin:0 0 20px;color:var(--vscode-foreground)}.context{display:flex;align-items:center;gap:8px;margin-bottom:22px;color:var(--vscode-descriptionForeground);font-size:12px}.chip{padding:4px 8px;border:1px solid var(--vscode-panel-border);border-radius:999px;background:var(--vscode-textCodeBlock-background);font-family:var(--vscode-editor-font-family)}
  .code-card{border:1px solid var(--vscode-panel-border);border-radius:9px;overflow:hidden;background:var(--vscode-textCodeBlock-background);margin:0 0 25px}.code-head{display:flex;justify-content:space-between;padding:9px 12px;border-bottom:1px solid var(--vscode-panel-border);font-size:11px;color:var(--vscode-descriptionForeground)}.code-card pre{margin:0;padding:14px;max-height:230px;overflow:auto;white-space:pre;font-family:var(--vscode-editor-font-family);font-size:12px;line-height:1.55}
  .answer{font-size:14px;overflow-wrap:anywhere}.answer h2{font-size:20px;margin:27px 0 10px}.answer h3{font-size:16px;margin:20px 0 8px}.answer p{margin:9px 0}.answer ul{padding-left:22px}.answer li{margin:5px 0}.answer strong{font-weight:700}.answer code{font-family:var(--vscode-editor-font-family);font-size:.9em;background:var(--vscode-textCodeBlock-background);padding:2px 5px;border-radius:4px}.answer pre{background:var(--vscode-textCodeBlock-background);border:1px solid var(--vscode-panel-border);border-radius:7px;padding:13px;overflow:auto}.answer pre code{background:none;padding:0}.empty{text-align:center;padding:62px 20px;color:var(--vscode-descriptionForeground);border:1px dashed var(--vscode-panel-border);border-radius:9px}.empty-icon{font-size:28px;margin-bottom:8px}.error{color:var(--vscode-errorForeground);white-space:pre-wrap}
  .composer{position:fixed;bottom:0;left:0;right:0;background:color-mix(in srgb,var(--vscode-editor-background) 94%,transparent);backdrop-filter:blur(10px);border-top:1px solid var(--vscode-panel-border);padding:12px 24px 14px}.composer-inner{max-width:850px;margin:auto;border:1px solid var(--vscode-focusBorder);border-radius:9px;background:var(--vscode-input-background);box-shadow:0 -4px 18px #00000012}.composer textarea{display:block;box-sizing:border-box;width:100%;min-height:58px;resize:none;padding:11px 13px;border:0;outline:0;background:transparent;color:var(--vscode-input-foreground);font:inherit;font-size:13px}.composer-actions{display:flex;align-items:center;justify-content:space-between;padding:5px 8px 7px;color:var(--vscode-descriptionForeground);font-size:11px}.button{border:0;border-radius:5px;padding:6px 10px;color:var(--vscode-button-foreground);background:var(--vscode-button-background);cursor:pointer}.button.secondary{color:var(--vscode-foreground);background:transparent}.button:disabled{opacity:.45;cursor:default}.support{text-align:center;margin:18px 0 0;font-size:11px}.support a{color:var(--vscode-textLink-foreground)}.status{font-size:11px;color:var(--vscode-descriptionForeground)}.busy{color:var(--vscode-charts-yellow)}
</style></head><body><div class="shell">
<header class="topbar"><div class="brand"><div class="logo">C</div><div><div class="title">AI Chat</div><div class="subtle">CodeExplain</div></div></div><div class="top-actions"><span id="status" class="status">Ready</span><button id="newChat" title="Clear explanation">＋ New Chat</button><button id="configure" title="Configure provider">⚙</button></div></header>
<main class="body"><div class="eyebrow">Selected code</div><h1 class="main-title">Explanation of the Code</h1><p class="summary" id="summary">Select code in the editor to get a clear explanation.</p><div class="context"><span id="language" class="chip">Code</span><span id="fileName" class="chip">No selection</span><button id="export" class="button secondary">Export</button></div>
<section id="codeCard" class="code-card" hidden><div class="code-head"><span id="codeLanguage">Code</span><span>Current selection</span></div><pre id="selectedCode"></pre></section><section id="empty" class="empty"><div class="empty-icon">✦</div><div>Your explanation will appear here.</div></section><article id="answer" class="answer" hidden></article><div class="support">${supportLink}</div></main>
<footer class="composer"><div class="composer-inner"><textarea id="question" placeholder="Ask a follow-up question about this code..."></textarea><div class="composer-actions"><span>Ctrl/Cmd + Enter to send</span><button id="ask" class="button">Ask question</button></div></div></footer></div>
<script nonce="${nonce}">
const vscode=acquireVsCodeApi();const answer=document.getElementById('answer');const empty=document.getElementById('empty');const status=document.getElementById('status');const question=document.getElementById('question');const codeCard=document.getElementById('codeCard');const selectedCode=document.getElementById('selectedCode');const language=document.getElementById('language');const codeLanguage=document.getElementById('codeLanguage');const fileName=document.getElementById('fileName');const summary=document.getElementById('summary');
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const fence=String.fromCharCode(96).repeat(3);const render=s=>{let x=esc(s);const blocks=[];x=x.replace(new RegExp(fence+'(?:[a-zA-Z0-9_+-]+)?\\n([\\s\\S]*?)'+fence,'g'),(_,c)=>{blocks.push('<pre><code>'+c.trim()+'</code></pre>');return '\\u0000'+(blocks.length-1)+'\\u0000'});x=x.replace(/^## (.*)$/gm,'<h2>$1</h2>').replace(/^### (.*)$/gm,'<h3>$1</h3>').replace(/^[-*] (.*)$/gm,'<li>$1</li>').replace(/(<li>.*<\\/li>\\n?)+/g,m=>'<ul>'+m+'</ul>').replace(/\\*\\*(.*?)\\*\\*/g,'<strong>$1</strong>').replace(new RegExp(fence+'([^'+fence+']+)'+fence,'g'),'<code>$1</code>');return x.split(/\\n{2,}/).map(p=>/^<(h[23]|ul|pre)/.test(p)?p:'<p>'+p.replace(/\\n/g,'<br>')+'</p>').join('').replace(/\\u0000(\\d+)\\u0000/g,(_,i)=>blocks[i])};
function busy(v){status.textContent=v?'Generating…':'Ready';status.className=v?'status busy':'status'}
function ask(){if(question.value.trim()){vscode.postMessage({type:'followUp',question:question.value});question.value=''}}
document.getElementById('ask').onclick=ask;question.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter')ask()});document.getElementById('newChat').onclick=()=>{answer.hidden=true;empty.hidden=false;codeCard.hidden=true;summary.textContent='Select code in the editor to get a clear explanation.'};document.getElementById('export').onclick=()=>vscode.postMessage({type:'export'});document.getElementById('configure').onclick=()=>vscode.postMessage({type:'configure'});document.getElementById('support').onclick=e=>{e.preventDefault();vscode.postMessage({type:'support'})};
window.addEventListener('message',e=>{const m=e.data;if(m.type==='start'){answer.hidden=true;empty.hidden=false;codeCard.hidden=false;selectedCode.textContent=m.request.code;language.textContent=m.request.language||'Code';codeLanguage.textContent=m.request.language||'Code';fileName.textContent=m.request.fileName||'Current selection';summary.textContent='Analyzing the selected code and preparing a clear breakdown…';busy(true)}if(m.type==='token'){empty.hidden=true;answer.hidden=false;answer.textContent+=m.token}if(m.type==='done'){answer.innerHTML=render(answer.textContent);summary.textContent='Here is a focused explanation of what this code does and why it matters.';busy(false)}if(m.type==='error'){empty.hidden=true;answer.hidden=false;answer.innerHTML='<div class="error">'+esc(m.message)+'</div>';busy(false)}});
</script></body></html>`;
  }
}
