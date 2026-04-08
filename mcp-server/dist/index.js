#!/usr/bin/env node
/**
 * Anyverse MCP Server — Apps Extension pattern
 * Uses registerResource + registerTool with _meta.ui for embedded UIs.
 * Transport: stateless StreamableHTTP (matches Claude.ai / API Dash expectation).
 */
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { profileFormApp } from "./apps/profileForm.js";
import { schemesDashboardApp } from "./apps/schemesDashboard.js";
import { docBundleViewerApp } from "./apps/docBundleViewer.js";
import { discoverSchemesWithRetry } from "./agents/discover.js";
import { verifyEligibility } from "./agents/verifier.js";
import { buildDocBundle } from "./agents/executor.js";
import { tracerRouter, emit } from "./tracer.js";
// ─── Constants ────────────────────────────────────────────────────────────────
const MIME = "text/html;profile=mcp-app";
const URI = "ui://anyverse";
// ─── MCP Server ──────────────────────────────────────────────────────────────
const server = new McpServer({
    name: "anyverse-mcp",
    version: "1.0.0",
});
// ════════════════════════════════════════════════════════════════════════════
// RESOURCE 1 — Profile Form (App 1)
// ════════════════════════════════════════════════════════════════════════════
server.registerResource("profile-form-ui", `${URI}/profile-form`, {
    mimeType: MIME,
    description: "Student onboarding form — collects personal, academic, and income details",
}, async (uri) => {
    console.log(`📱 resources/read: ${uri.href}`);
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: MIME,
                text: profileFormApp(),
            },
        ],
    };
});
// TOOL 1 — build_student_profile (model + app) → opens App 1
server.registerTool("build_student_profile", {
    description: "Opens the student onboarding form (App 1) as an embedded MCP app. The user fills in personal, academic, and income details. When they submit, App 1 calls fetch_opportunities internally.",
    _meta: {
        ui: {
            resourceUri: `${URI}/profile-form`,
            visibility: ["model", "app"],
        },
    },
}, async () => {
    emit("tool_call", { tool: "build_student_profile", status: "started" });
    emit("tool_call", { tool: "build_student_profile", status: "completed" });
    return {
        content: [
            {
                type: "text",
                text: "Student profile form opened. Waiting for user to fill and submit the form.",
            },
        ],
    };
});
// ════════════════════════════════════════════════════════════════════════════
// RESOURCE 2 — Schemes Dashboard (App 2)
// ════════════════════════════════════════════════════════════════════════════
server.registerResource("schemes-dashboard-ui", `${URI}/schemes-dashboard`, {
    mimeType: MIME,
    description: "Schemes dashboard — shows matching schemes, allows eligibility check and bundle generation",
}, async (uri) => {
    console.log(`📱 resources/read: ${uri.href}`);
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: MIME,
                text: schemesDashboardApp(),
            },
        ],
    };
});
// TOOL 2 — fetch_opportunities (app-only) — called by App 1's iframe
const ProfileSchema = z.object({
    name: z.string(),
    state: z.string(),
    category: z.string(),
    annualIncome: z.number(),
    courseLevel: z.enum(["10th", "12th", "UG", "PG", "PhD"]),
    percentage: z.number(),
    gender: z.enum(["male", "female", "other"]),
    disability: z.boolean().default(false),
});
server.registerTool("fetch_opportunities", {
    description: "Called from inside App 1 after the student submits their profile. Runs the discover agent to find matching schemes. The structured result is sent back to the calling app via tool-input notification.",
    inputSchema: {
        profile: ProfileSchema,
    },
    _meta: {
        ui: {
            resourceUri: `${URI}/profile-form`,
            visibility: ["app"],
        },
    },
}, async ({ profile }) => {
    emit("tool_call", { tool: "fetch_opportunities", status: "started", profile: profile.name });
    const { schemes, retried } = discoverSchemesWithRetry(profile, emit);
    emit("agent_step", { agent: "discover", schemesFound: schemes.length, retried });
    emit("tool_call", { tool: "fetch_opportunities", status: "completed", schemesFound: schemes.length });
    return {
        content: [{ type: "text", text: JSON.stringify({ profile, schemes }) }],
        structuredContent: { profile, schemes },
    };
});
// TOOL 3 — show_schemes_dashboard (model + app) — called by the model after profile is built
server.registerTool("show_schemes_dashboard", {
    description: "Opens the Schemes Dashboard (App 2). Pass the profile and schemes list so the dashboard can render. The app will receive data via ui/notifications/tool-input.",
    inputSchema: {
        profile: ProfileSchema,
        schemes: z.array(z.object({
            id: z.string(),
            name: z.string(),
            type: z.string(),
            ministry: z.string(),
            amount: z.string(),
            description: z.string(),
            rules: z.record(z.string(), z.unknown()),
        })),
    },
    _meta: {
        ui: {
            resourceUri: `${URI}/schemes-dashboard`,
            visibility: ["model", "app"],
        },
    },
}, async ({ profile, schemes }) => {
    emit("tool_call", { tool: "show_schemes_dashboard", status: "completed", schemesCount: schemes.length });
    return {
        content: [
            {
                type: "text",
                text: `Schemes dashboard opened for ${profile.name}. Found ${schemes.length} schemes.`,
            },
        ],
        structuredContent: { profile, schemes },
    };
});
// ════════════════════════════════════════════════════════════════════════════
// RESOURCE 3 — Doc Bundle Viewer (App 3)
// ════════════════════════════════════════════════════════════════════════════
server.registerResource("doc-bundle-viewer-ui", `${URI}/doc-bundle-viewer`, {
    mimeType: MIME,
    description: "Document bundle viewer — shows checklist of required documents with download links",
}, async (uri) => {
    console.log(`📱 resources/read: ${uri.href}`);
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: MIME,
                text: docBundleViewerApp(),
            },
        ],
    };
});
// TOOL 4 — check_eligibility (app-only) — called by App 2's iframe
server.registerTool("check_eligibility", {
    description: "Runs the verifier agent against a specific scheme and student profile. Returns a structured eligibility result.",
    inputSchema: {
        schemeId: z.string(),
        profile: z.object({
            state: z.string(),
            category: z.string(),
            annualIncome: z.number(),
            courseLevel: z.enum(["10th", "12th", "UG", "PG", "PhD"]),
            percentage: z.number(),
            gender: z.enum(["male", "female", "other"]),
            disability: z.boolean(),
        }),
    },
    _meta: {
        ui: {
            resourceUri: `${URI}/schemes-dashboard`,
            visibility: ["app"],
        },
    },
}, async ({ schemeId, profile }) => {
    emit("tool_call", { tool: "check_eligibility", status: "started", schemeId });
    const result = verifyEligibility(schemeId, profile);
    emit("agent_step", { agent: "verifier", schemeId, eligible: result.eligible });
    emit("tool_call", { tool: "check_eligibility", status: "completed", eligible: result.eligible });
    return {
        content: [{ type: "text", text: JSON.stringify(result) }],
        structuredContent: result,
    };
});
// TOOL 5 — generate_doc_bundle (app-only) — called by App 2's iframe
server.registerTool("generate_doc_bundle", {
    description: "Runs the executor agent to build a document checklist for selected schemes. Returns the bundle data.",
    inputSchema: {
        schemeIds: z.array(z.string()).min(1),
        studentId: z.string(),
    },
    _meta: {
        ui: {
            resourceUri: `${URI}/schemes-dashboard`,
            visibility: ["app"],
        },
    },
}, async ({ schemeIds, studentId }) => {
    emit("tool_call", { tool: "generate_doc_bundle", status: "started", schemeIds });
    const bundle = buildDocBundle(schemeIds, studentId);
    emit("agent_step", { agent: "executor", documentsRequired: bundle.documents.length });
    emit("tool_call", { tool: "generate_doc_bundle", status: "completed", documentsReady: bundle.documents.length });
    return {
        content: [{ type: "text", text: JSON.stringify(bundle) }],
        structuredContent: bundle,
    };
});
// TOOL 6 — show_doc_bundle (model + app) — called by the model after bundle is generated
server.registerTool("show_doc_bundle", {
    description: "Opens the Doc Bundle Viewer (App 3). The app receives data via ui/notifications/tool-input.",
    inputSchema: {
        bundle: z.object({
            studentId: z.string(),
            schemes: z.array(z.string()),
            documents: z.array(z.object({
                name: z.string(),
                forSchemes: z.array(z.string()),
                available: z.boolean(),
                mockUrl: z.string().optional(),
            })),
        }),
    },
    _meta: {
        ui: {
            resourceUri: `${URI}/doc-bundle-viewer`,
            visibility: ["model", "app"],
        },
    },
}, async ({ bundle }) => {
    emit("tool_call", { tool: "show_doc_bundle", status: "completed", docs: bundle.documents.length });
    return {
        content: [
            {
                type: "text",
                text: `Document bundle opened for student ${bundle.studentId}. ${bundle.documents.length} documents listed.`,
            },
        ],
        structuredContent: { bundle },
    };
});
// ─── Express HTTP Server ─────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());
// SSE trace stream for the frontend AgentTrace panel
app.use("/trace", tracerRouter);
// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", server: "anyverse-mcp" });
});
// MCP endpoint — stateless (matches Claude.ai / API Dash)
app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
});
const PORT = parseInt(process.env.PORT ?? "3000");
app.listen(PORT, () => {
    console.log(`🚀 Anyverse MCP Server running on http://localhost:${PORT}`);
    console.log(`   MCP endpoint  : http://localhost:${PORT}/mcp`);
    console.log(`   Trace stream  : http://localhost:${PORT}/trace/stream`);
    console.log(`   Inspector     : npx @modelcontextprotocol/inspector http://localhost:${PORT}/mcp`);
});
//# sourceMappingURL=index.js.map