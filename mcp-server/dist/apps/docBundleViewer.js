/**
 * App 3 — Document Bundle Viewer
 *
 * Receives bundle data dynamically via ui/notifications/tool-input.
 * JSON-RPC 2.0 communication:
 *  1. ui/initialize → host wires channel
 *  2. ui/notifications/initialized → confirm ready
 *  3. Receives { bundle } via ui/notifications/tool-input from host
 *  4. Renders document checklist with download links
 */
export function docBundleViewerApp() {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Anyverse — Document Bundle</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      min-height: 100vh;
      padding: 32px 24px;
      color: #e2e8f0;
    }
    h1 { font-size: 1.5rem; color: #a78bfa; margin-bottom: 6px; }
    .sub { color: #64748b; font-size: 0.85rem; margin-bottom: 28px; }
    .progress-bar { background: rgba(255,255,255,0.08); border-radius: 99px; height: 8px; margin-bottom: 24px; overflow: hidden; }
    .progress-fill { background: linear-gradient(90deg, #7c3aed, #a855f7); height: 100%; border-radius: 99px; transition: width 0.6s; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 10px 14px; font-size: 0.75rem; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid rgba(255,255,255,0.08); }
    td { padding: 12px 14px; font-size: 0.88rem; border-bottom: 1px solid rgba(255,255,255,0.05); vertical-align: middle; }
    tr.available .status-dot { background: #34d399; }
    tr.missing .status-dot { background: #f87171; }
    .status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 8px; vertical-align: middle; }
    .dl-btn {
      background: rgba(52,211,153,0.15); color: #34d399;
      padding: 4px 12px; border-radius: 8px; text-decoration: none; font-size: 0.8rem; font-weight: 600;
      transition: background 0.2s;
    }
    .dl-btn:hover { background: rgba(52,211,153,0.3); }
    .missing-tag { background: rgba(248,113,113,0.1); color: #f87171; padding: 4px 12px; border-radius: 8px; font-size: 0.8rem; }
    .dl-all {
      margin-top: 28px; display: inline-block;
      background: linear-gradient(90deg, #7c3aed, #a855f7);
      color: #fff; padding: 12px 28px; border-radius: 12px;
      font-weight: 700; text-decoration: none; cursor: pointer; border: none; font-size: 0.95rem;
    }
    #loadingMsg {
      padding: 60px;
      text-align: center;
      color: #64748b;
      font-size: 1rem;
    }
    #content { display: none; }
  </style>
</head>
<body>
  <div id="loadingMsg">⏳ Preparing your document bundle…</div>

  <div id="content">
    <h1>📦 Document Bundle</h1>
    <p class="sub" id="bundleSub"></p>
    <div class="progress-bar">
      <div class="progress-fill" id="progressFill" style="width:0%"></div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Document</th>
          <th>Required For</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody id="docRows"></tbody>
    </table>
    <br/>
    <button class="dl-all" onclick="downloadAll()">⬇ Download All Available</button>
  </div>

  <script>
    // ── JSON-RPC 2.0 helpers ──────────────────────────────────────────────
    let nextId = 1;
    const pending = new Map();

    function sendRequest(method, params) {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        window.parent.postMessage({ jsonrpc: '2.0', id, method, params: params || {} }, '*');
      });
    }

    function sendNotification(method, params) {
      window.parent.postMessage({ jsonrpc: '2.0', method, params: params || {} }, '*');
    }

    // ── State ────────────────────────────────────────────────────────────
    let currentBundle = null;

    // ── Message handler ──────────────────────────────────────────────────
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || msg.jsonrpc !== '2.0') return;

      // JSON-RPC response
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
        return;
      }

      // Notification from host: tool-input delivers show_doc_bundle structuredContent
      if (msg.method === 'ui/notifications/tool-input') {
        const data = msg.params?.structuredContent || msg.params;
        // host sends { bundle: { studentId, schemes, documents } }
        const bundle = data?.bundle ?? data;
        if (bundle?.documents) {
          currentBundle = bundle;
          renderBundle();
        }
      }
    });

    // ── Render ───────────────────────────────────────────────────────────
    function renderBundle() {
      const bundle = currentBundle;
      document.getElementById('loadingMsg').style.display = 'none';
      document.getElementById('content').style.display = 'block';

      document.getElementById('bundleSub').textContent =
        'Student ID: ' + bundle.studentId + ' · ' + (bundle.schemes || []).join(' · ');

      const available = bundle.documents.filter(d => d.available).length;
      const pct = Math.round((available / bundle.documents.length) * 100);
      document.getElementById('progressFill').style.width = pct + '%';

      document.getElementById('docRows').innerHTML = bundle.documents.map(d => \`
        <tr class="\${d.available ? 'available' : 'missing'}">
          <td><span class="status-dot"></span>\${d.name}</td>
          <td>\${(d.forSchemes || []).join(', ')}</td>
          <td>
            \${d.available && d.mockUrl
              ? \`<a href="\${d.mockUrl}" target="_blank" class="dl-btn">⬇ Download</a>\`
              : '<span class="missing-tag">Upload Required</span>'
            }
          </td>
        </tr>
      \`).join('');
    }

    // ── Download all ─────────────────────────────────────────────────────
    function downloadAll() {
      if (!currentBundle) return;
      currentBundle.documents
        .filter(d => d.available && d.mockUrl)
        .forEach(d => window.open(d.mockUrl, '_blank'));
    }

    // ── Initialize ───────────────────────────────────────────────────────
    async function initialize() {
      try {
        await sendRequest('ui/initialize', {
          protocolVersion: '2025-11-21',
          capabilities: {},
          clientInfo: { name: 'anyverse-doc-bundle-viewer', version: '1.0.0' },
        });
        sendNotification('ui/notifications/initialized', {});
      } catch (e) {
        // standalone/dev mode
      }
    }

    initialize();
  </script>
</body>
</html>`;
}
//# sourceMappingURL=docBundleViewer.js.map