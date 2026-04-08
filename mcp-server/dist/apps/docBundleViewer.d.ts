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
export declare function docBundleViewerApp(): string;
