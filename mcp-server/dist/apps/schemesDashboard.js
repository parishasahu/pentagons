/**
 * App 2 — Schemes Dashboard
 *
 * Receives data dynamically via ui/notifications/tool-input (not baked-in at render time).
 * JSON-RPC 2.0 communication:
 *  1. ui/initialize → host wires channel
 *  2. ui/notifications/initialized → confirm ready
 *  3. Receives { profile, schemes } via ui/notifications/tool-input from host
 *  4. On "Check Eligibility": tools/call → check_eligibility (app-only)
 *  5. On "Generate Bundle": tools/call → generate_doc_bundle (app-only)
 *     then ui/update-model-context { schemeIds, studentId }
 */
export function schemesDashboardApp() {
    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Anyverse — Schemes Dashboard</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f172a, #1e1b4b);
      min-height: 100vh;
      padding: 32px 24px;
      color: #e2e8f0;
    }
    header { margin-bottom: 28px; }
    header h1 { font-size: 1.6rem; color: #a78bfa; }
    header p { color: #64748b; font-size: 0.88rem; margin-top: 4px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 16px;
      padding: 22px;
      position: relative;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .card:hover { transform: translateY(-3px); box-shadow: 0 12px 30px rgba(124,58,237,0.2); }
    .badge {
      display: inline-block;
      background: rgba(167,139,250,0.15);
      color: #a78bfa;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 3px 10px;
      border-radius: 99px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    h3 { font-size: 1rem; font-weight: 700; margin-bottom: 6px; }
    .ministry { font-size: 0.78rem; color: #64748b; margin-bottom: 6px; }
    .amount { font-size: 0.9rem; color: #34d399; font-weight: 600; margin-bottom: 8px; }
    .desc { font-size: 0.82rem; color: #94a3b8; line-height: 1.5; margin-bottom: 14px; }
    .actions { display: flex; gap: 8px; }
    .btn-check, .btn-apply {
      flex: 1; padding: 8px; border: none; border-radius: 8px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
    }
    .btn-check { background: rgba(167,139,250,0.2); color: #a78bfa; }
    .btn-apply { background: linear-gradient(90deg,#7c3aed,#a855f7); color: #fff; }
    .btn-check:hover, .btn-apply:hover { opacity: 0.8; }
    .elig-result { margin-top: 12px; font-size: 0.82rem; border-radius: 8px; padding: 0; overflow: hidden; }
    .elig-result.show { padding: 10px 12px; background: rgba(255,255,255,0.05); }
    .elig-result.eligible { color: #34d399; }
    .elig-result.ineligible { color: #f87171; }
    .bundle-bar {
      position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
      background: linear-gradient(90deg,#7c3aed,#a855f7);
      color: #fff; padding: 12px 28px; border-radius: 99px;
      font-size: 0.9rem; font-weight: 700; cursor: pointer;
      box-shadow: 0 8px 24px rgba(124,58,237,0.4);
      display: none; align-items: center; gap: 10px;
    }
    .bundle-bar.show { display: flex; }
    #loadingMsg {
      padding: 60px;
      text-align: center;
      color: #64748b;
      font-size: 1rem;
    }
  </style>
</head>
<body>
  <div id="loadingMsg">⏳ Loading schemes…</div>
  <div id="content" style="display:none">
    <header>
      <h1 id="headerTitle">📋 Your Schemes</h1>
      <p id="headerSub"></p>
    </header>
    <div class="grid" id="schemesGrid"></div>
    <div class="bundle-bar" id="bundleBar">
      <span id="bundleCount">0 schemes</span> selected &nbsp;→&nbsp;
      <span onclick="generateBundle()">Generate Doc Bundle</span>
    </div>
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
    let currentProfile = null;
    let currentSchemes = [];
    const selected = new Set();

    // ── message handler ──────────────────────────────────────────────────
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || msg.jsonrpc !== '2.0') return;

      // JSON-RPC response (for pending requests)
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
        return;
      }

      // Notification from host: tool-input delivers show_schemes_dashboard structuredContent
      if (msg.method === 'ui/notifications/tool-input') {
        const data = msg.params?.structuredContent || msg.params;
        if (data?.profile && data?.schemes) {
          currentProfile = data.profile;
          currentSchemes = data.schemes;
          renderDashboard();
        }
      }
    });

    // ── Render ───────────────────────────────────────────────────────────
    function renderDashboard() {
      document.getElementById('loadingMsg').style.display = 'none';
      document.getElementById('content').style.display = 'block';
      document.getElementById('headerTitle').textContent =
        '📋 Schemes for ' + currentProfile.name;
      document.getElementById('headerSub').textContent =
        currentSchemes.length + ' schemes found · ' +
        currentProfile.state + ' · ' + currentProfile.category + ' · ' + currentProfile.courseLevel;

      const grid = document.getElementById('schemesGrid');
      grid.innerHTML = currentSchemes.map(s => \`
        <div class="card" data-id="\${s.id}">
          <div class="badge">\${s.type}</div>
          <h3>\${s.name}</h3>
          <p class="ministry">\${s.ministry}</p>
          <p class="amount">💰 \${s.amount}</p>
          <p class="desc">\${s.description}</p>
          <div class="actions">
            <button class="btn-check" onclick="checkEligibility('\${s.id}')">Check Eligibility</button>
            <button class="btn-apply" onclick="addToBundle('\${s.id}')">+ Add to Bundle</button>
          </div>
          <div class="elig-result" id="elig-\${s.id}"></div>
        </div>
      \`).join('');
    }

    // ── Eligibility check ────────────────────────────────────────────────
    async function checkEligibility(schemeId) {
      const el = document.getElementById('elig-' + schemeId);
      el.textContent = '⏳ Checking…';
      el.className = 'elig-result show';
      try {
        const result = await sendRequest('tools/call', {
          name: 'check_eligibility',
          arguments: { schemeId, profile: currentProfile },
        });
        const data = result?.structuredContent || JSON.parse(result?.content?.[0]?.text || '{}');
        el.textContent = data.eligible
          ? '✅ Eligible — ' + data.reason
          : '❌ Not eligible — ' + data.reason;
        el.className = 'elig-result show ' + (data.eligible ? 'eligible' : 'ineligible');
      } catch (err) {
        el.textContent = '❌ Error: ' + err.message;
        el.className = 'elig-result show ineligible';
      }
    }

    // ── Bundle ───────────────────────────────────────────────────────────
    function addToBundle(schemeId) {
      selected.add(schemeId);
      const bar = document.getElementById('bundleBar');
      bar.classList.add('show');
      document.getElementById('bundleCount').textContent =
        selected.size + ' scheme' + (selected.size > 1 ? 's' : '');
    }

    async function generateBundle() {
      const studentId = currentProfile.name.replace(/ /g, '_').toLowerCase();
      try {
        const result = await sendRequest('tools/call', {
          name: 'generate_doc_bundle',
          arguments: { schemeIds: [...selected], studentId },
        });

        // Let the model know what was selected
        await sendRequest('ui/update-model-context', {
          structuredContent: {
            schemeIds: [...selected],
            studentId,
            bundle: result?.structuredContent ?? null,
          },
        });
      } catch (err) {
        alert('Error generating bundle: ' + err.message);
      }
    }

    // ── Initialize ───────────────────────────────────────────────────────
    async function initialize() {
      try {
        await sendRequest('ui/initialize', {
          protocolVersion: '2025-11-21',
          capabilities: {},
          clientInfo: { name: 'anyverse-schemes-dashboard', version: '1.0.0' },
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
//# sourceMappingURL=schemesDashboard.js.map