/**
 * App 1 — Student Profile Form
 *
 * JSON-RPC 2.0 communication with the MCP host:
 *  1. ui/initialize  → host wires the channel
 *  2. ui/notifications/initialized → confirm ready
 *  3. On submit: tools/call → fetch_opportunities (app-only tool)
 *  4. ui/update-model-context → pass profile to the LLM
 */
export declare function profileFormApp(): string;
