import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';

export function activate(ctx: vscode.ExtensionContext) {
  const cmd = vscode.commands.registerCommand('tmTree.open', async () => {
    const panel = vscode.window.createWebviewPanel(
      'tmTree',
      'TaskMaster — Tree View',
      vscode.ViewColumn.Active,
      { enableScripts: true, retainContextWhenHidden: true }
    );

    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    const jsonPath = path.join(root, '.taskmaster', 'tasks', 'tasks.json');

    panel.webview.html = await getHtml(ctx, panel);

    async function push() {
      try {
        const txt = await fs.readFile(jsonPath, 'utf8');
        panel.webview.postMessage({ type: 'tasks', payload: txt });
      } catch (err: any) {
        panel.webview.postMessage({ type: 'error', payload: err.message || String(err) });
      }
    }

    const rel = new vscode.RelativePattern(root, '.taskmaster/tasks/tasks.json');
    const watcher = vscode.workspace.createFileSystemWatcher(rel);
    watcher.onDidChange(push);
    watcher.onDidCreate(push);
    ctx.subscriptions.push(watcher);

    await push();

    panel.webview.onDidReceiveMessage(async (msg) => {
      if (msg?.type === 'save') {
        try {
          await fs.mkdir(path.dirname(jsonPath), { recursive: true });
          await fs.writeFile(jsonPath, msg.payload, 'utf8');
          await push();
        } catch (err: any) {
          vscode.window.showErrorMessage(`Save failed: ${err?.message || err}`);
        }
      }
    });
  });

  ctx.subscriptions.push(cmd);
}

async function getHtml(ctx: vscode.ExtensionContext, panel: vscode.WebviewPanel): Promise<string> {
  const fileUri = vscode.Uri.joinPath(ctx.extensionUri, 'media', 'index.html');
  let html = await fs.readFile(fileUri.fsPath, 'utf8');

  const bridge = `
  <script>
    (function(){
      const vscodeApi = typeof acquireVsCodeApi === 'function' ? acquireVsCodeApi() : null;

      window.addEventListener('message', (e) => {
        const msg = e.data;
        if (!msg) return;
        if (msg.type === 'tasks') {
          try { applyJson(msg.payload); } catch (err) { alert('Invalid JSON: ' + (err && err.message || err)); }
        }
        if (msg.type === 'error') { console.warn(msg.payload); }
      });

      // Expose optional "Save Back" in case your UI wants to write to tasks.json
      // Call window.__tmSaveToFile() from your page to persist current "data" back.
      (window as any).__tmSaveToFile = function(){
        try {
          if (!vscodeApi) return alert('Save unavailable in this environment.');
          const payload = JSON.stringify((window as any).data || {}, null, 2);
          vscodeApi.postMessage({ type: 'save', payload });
        } catch (e) {
          alert('Save error: ' + (e && e.message || e));
        }
      };
    })();
  </script>`;

  // Inject right before </body> (keeps your file untouched)
  html = html.replace(/<\/body>\s*<\/html>\s*$/i, `${bridge}\n</body>\n</html>`);
  return html;
}

export function deactivate() {}
