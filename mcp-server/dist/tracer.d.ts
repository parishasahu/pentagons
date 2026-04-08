export declare const tracerRouter: import("express-serve-static-core").Router;
/**
 * Broadcast a trace event to all connected SSE clients.
 *
 * @param type  - Event type, e.g. "tool_call" | "agent_step" | "error"
 * @param data  - Arbitrary payload to serialise as JSON
 */
export declare function emit(type: string, data: Record<string, unknown>): void;
