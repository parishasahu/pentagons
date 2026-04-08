/**
 * App 1 — Student Profile Form
 *
 * JSON-RPC 2.0 communication with the MCP host:
 *  1. ui/initialize  → host wires the channel
 *  2. ui/notifications/initialized → confirm ready
 *  3. On submit: tools/call → fetch_opportunities (app-only tool)
 *  4. ui/update-model-context → pass profile to the LLM
 */
export function profileFormApp(): string {
  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Anyverse — Student Profile</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      color: #e2e8f0;
    }
    .card {
      background: rgba(255,255,255,0.06);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 40px;
      width: 100%;
      max-width: 540px;
      box-shadow: 0 25px 50px rgba(0,0,0,0.5);
    }
    h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 6px; color: #a78bfa; }
    p.sub { font-size: 0.85rem; color: #94a3b8; margin-bottom: 28px; }
    label { display: block; font-size: 0.78rem; font-weight: 600; color: #94a3b8; margin-bottom: 5px; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.05em; }
    input, select {
      width: 100%;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 10px 14px;
      color: #e2e8f0;
      font-size: 0.95rem;
      outline: none;
      transition: border-color 0.2s;
    }
    input:focus, select:focus { border-color: #a78bfa; }
    select option { background: #1e1b4b; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .checkbox-row { display: flex; align-items: center; gap: 10px; margin-top: 16px; }
    .checkbox-row input { width: auto; }
    button {
      margin-top: 28px;
      width: 100%;
      padding: 13px;
      background: linear-gradient(90deg, #7c3aed, #a855f7);
      border: none;
      border-radius: 12px;
      color: #fff;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.1s;
    }
    button:hover { opacity: 0.9; transform: translateY(-1px); }
    button:active { transform: translateY(0); }
    button:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    #statusMsg {
      margin-top: 14px;
      font-size: 0.85rem;
      color: #94a3b8;
      text-align: center;
      min-height: 20px;
    }
    #statusMsg.error { color: #f87171; }
    #statusMsg.success { color: #34d399; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🎓 Student Profile</h1>
    <p class="sub">Fill in your details to discover government schemes tailored for you.</p>
    <form id="profileForm">
      <label>Full Name</label>
      <input id="name" type="text" placeholder="e.g. Priya Sharma" required />

      <div class="row">
        <div>
          <label>State</label>
          <select id="state">
            <option>Andhra Pradesh</option><option>Bihar</option>
            <option>Delhi</option><option>Gujarat</option>
            <option>Karnataka</option><option>Maharashtra</option>
            <option>Rajasthan</option><option>Tamil Nadu</option>
            <option>Uttar Pradesh</option><option>West Bengal</option>
          </select>
        </div>
        <div>
          <label>Category</label>
          <select id="category">
            <option value="General">General</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
            <option value="EWS">EWS</option>
          </select>
        </div>
      </div>

      <div class="row">
        <div>
          <label>Annual Family Income (₹)</label>
          <input id="annualIncome" type="number" placeholder="e.g. 250000" required />
        </div>
        <div>
          <label>Gender</label>
          <select id="gender">
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div class="row">
        <div>
          <label>Course Level</label>
          <select id="courseLevel">
            <option value="10th">10th</option>
            <option value="12th">12th</option>
            <option value="UG">UG (Graduate)</option>
            <option value="PG">PG (Post-Graduate)</option>
            <option value="PhD">PhD</option>
          </select>
        </div>
        <div>
          <label>Percentage / CGPA (%)</label>
          <input id="percentage" type="number" min="0" max="100" placeholder="e.g. 85" required />
        </div>
      </div>

      <div class="checkbox-row">
        <input id="disability" type="checkbox" />
        <label style="margin:0;text-transform:none;font-size:0.9rem">Person with Disability (PwD)</label>
      </div>

      <button type="submit" id="submitBtn">Find My Schemes →</button>
      <div id="statusMsg"></div>
    </form>
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

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || msg.jsonrpc !== '2.0') return;
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve, reject } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });

    // ── Status helper ────────────────────────────────────────────────────
    function setStatus(msg, cls) {
      const el = document.getElementById('statusMsg');
      el.textContent = msg;
      el.className = cls || '';
    }

    // ── Initialize handshake ─────────────────────────────────────────────
    async function initialize() {
      try {
        setStatus('Connecting to MCP host…');
        await sendRequest('ui/initialize', {
          protocolVersion: '2025-11-21',
          capabilities: {},
          clientInfo: { name: 'anyverse-profile-form', version: '1.0.0' },
        });
        sendNotification('ui/notifications/initialized', {});
        setStatus('');
      } catch (e) {
        setStatus(''); // standalone/dev mode — fine
      }
    }

    // ── Form submit ──────────────────────────────────────────────────────
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const profile = {
        name:         document.getElementById('name').value,
        state:        document.getElementById('state').value,
        category:     document.getElementById('category').value,
        annualIncome: parseInt(document.getElementById('annualIncome').value),
        courseLevel:  document.getElementById('courseLevel').value,
        percentage:   parseFloat(document.getElementById('percentage').value),
        gender:       document.getElementById('gender').value,
        disability:   document.getElementById('disability').checked,
      };

      const btn = document.getElementById('submitBtn');
      btn.disabled = true;
      setStatus('🔍 Discovering schemes for you…');

      try {
        // Step 1: call fetch_opportunities (app-only tool)
        const result = await sendRequest('tools/call', {
          name: 'fetch_opportunities',
          arguments: { profile },
        });

        const schemes = result?.structuredContent?.schemes ?? [];

        // Step 2: push profile + discovered schemes into model context
        await sendRequest('ui/update-model-context', {
          structuredContent: {
            profile,
            schemes,
          },
        });

        // Step 3: open App 2 directly so users always see the dashboard.
        await sendRequest('tools/call', {
          name: 'show_schemes_dashboard',
          arguments: {
            profile,
            schemes,
          },
        });

        setStatus('✅ Schemes found! Check the dashboard.', 'success');
      } catch (err) {
        setStatus('❌ Error: ' + (err.message || 'Unknown error'), 'error');
        btn.disabled = false;
      }
    });

    initialize();
  </script>
</body>
</html>`;
}
