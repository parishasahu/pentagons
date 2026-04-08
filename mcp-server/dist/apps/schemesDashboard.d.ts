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
export declare function schemesDashboardApp(): string;
