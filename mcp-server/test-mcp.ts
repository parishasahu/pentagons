import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import EventSource from "eventsource";

// Polyfill EventSource for Node.js
global.EventSource = EventSource as any;

async function runTest() {
  console.log("Connecting to MCP SSE endpoint...");
  
  // Use SSEClientTransport pointing to localhost
  const transport = new SSEClientTransport(
    new URL("http://localhost:3000/mcp")
  );

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    await client.connect(transport);
    console.log("✅ Successfully connected to MCP server.");

    console.log("Calling tool: check_eligibility...");
    const result = await client.callTool({
      name: "check_eligibility",
      arguments: {
        schemeId: "scholarship-2026",
        profile: {
          state: "MH",
          category: "General",
          annualIncome: 300000,
          courseLevel: "UG",
          percentage: 88,
          gender: "female",
          disability: false
        }
      }
    });

    console.log("✅ Tool response:", JSON.stringify(result, null, 2));

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    process.exit(0);
  }
}

runTest();
