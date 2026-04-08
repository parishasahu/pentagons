const http = require('http');

async function testMcp() {
  // 1. Initialize
  const initRes = await fetch("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "test-client", version: "1.0.0" }
      }
    })
  });

  const sessionId = initRes.headers.get("mcp-session-id");
  console.log("Session initialized. Session ID:", sessionId);

  // Read response stream for initialization response
  const reader = initRes.body.getReader();
  const decoder = new TextDecoder();
  let done = false;
  let sseData = "";
  
  while (!done) {
    const { value, done: readerDone } = await reader.read();
    if (value) sseData += decoder.decode(value);
    done = readerDone;
    if (sseData.includes("protocolVersion")) break; 
  }
  
  console.log("Initialize Response:", sseData);

  // 2. Send 'initialized' notification
  await fetch("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "mcp-session-id": sessionId
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized"
    })
  });
  console.log("Sent initialized notification.");

  // 3. Call check_eligibility tool
  const callRes = await fetch("http://localhost:3000/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "mcp-session-id": sessionId
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "check_eligibility",
        arguments: {
          schemeId: "scheme-abc",
          profile: {
            state: "MH",
            category: "General",
            annualIncome: 450000,
            courseLevel: "UG",
            percentage: 85,
            gender: "male",
            disability: false
          }
        }
      }
    })
  });

  const callResultText = await callRes.text();
  console.log("Tool call result:", callResultText);
}

testMcp().catch(console.error);
