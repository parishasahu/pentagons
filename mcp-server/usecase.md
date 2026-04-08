# Anyverse MCP Use Cases and Commands

This document lists every practical MCP command you can send to this server and every tool you can call.

## 1) Server Endpoints

- Health check: GET /health
- MCP endpoint: POST /mcp
- Trace stream (UI debug): GET /trace/stream

## 2) MCP Protocol Commands (JSON-RPC)

Use these on POST /mcp.

### 2.1 Initialize session

    {
      "jsonrpc": "2.0",
      "id": 1,
      "method": "initialize",
      "params": {
        "protocolVersion": "2024-11-05",
        "capabilities": {},
        "clientInfo": {
          "name": "test-client",
          "version": "1.0.0"
        }
      }
    }

### 2.2 Send initialized notification

    {
      "jsonrpc": "2.0",
      "method": "notifications/initialized"
    }

### 2.3 List tools

    {
      "jsonrpc": "2.0",
      "id": 2,
      "method": "tools/list"
    }

### 2.4 Call a tool

    {
      "jsonrpc": "2.0",
      "id": 3,
      "method": "tools/call",
      "params": {
        "name": "build_student_profile",
        "arguments": {}
      }
    }

### 2.5 List resources (UI apps)

    {
      "jsonrpc": "2.0",
      "id": 4,
      "method": "resources/list"
    }

### 2.6 Read a resource

    {
      "jsonrpc": "2.0",
      "id": 5,
      "method": "resources/read",
      "params": {
        "uri": "ui://anyverse/profile-form"
      }
    }

## 3) Tool Catalog (All MCP Tools)

## Tool 1: build_student_profile

- Visibility: model, app
- Purpose: Opens App 1 (student profile form)
- Arguments: none

    {
      "jsonrpc": "2.0",
      "id": 11,
      "method": "tools/call",
      "params": {
        "name": "build_student_profile",
        "arguments": {}
      }
    }

## Tool 2: fetch_opportunities

- Visibility: app only
- Purpose: Finds matching schemes for a profile
- Arguments:
  - profile.name string
  - profile.state string
  - profile.category string
  - profile.annualIncome number
  - profile.courseLevel one of 10th, 12th, UG, PG, PhD
  - profile.percentage number
  - profile.gender one of male, female, other
  - profile.disability boolean

    {
      "jsonrpc": "2.0",
      "id": 12,
      "method": "tools/call",
      "params": {
        "name": "fetch_opportunities",
        "arguments": {
          "profile": {
            "name": "Nihir",
            "state": "Karnataka",
            "category": "EWS",
            "annualIncome": 600000,
            "courseLevel": "PG",
            "percentage": 82,
            "gender": "male",
            "disability": false
          }
        }
      }
    }

## Tool 3: show_schemes_dashboard

- Visibility: model, app
- Purpose: Opens App 2 with profile + schemes
- Important: each scheme object must include rules
- Arguments:
  - profile object (same shape as above)
  - schemes array with fields:
    - id, name, type, ministry, amount, description, rules

    {
      "jsonrpc": "2.0",
      "id": 13,
      "method": "tools/call",
      "params": {
        "name": "show_schemes_dashboard",
        "arguments": {
          "profile": {
            "name": "Nihir",
            "state": "Karnataka",
            "category": "EWS",
            "annualIncome": 600000,
            "courseLevel": "PG",
            "percentage": 82,
            "gender": "male",
            "disability": false
          },
          "schemes": [
            {
              "id": "MOMA_POST_MATRIC",
              "name": "Post-Matric Scholarship for Minority Communities",
              "type": "Scholarship",
              "ministry": "Ministry of Minority Affairs",
              "amount": "₹600 – ₹1,200 / month",
              "description": "For minority students beyond Class 10.",
              "rules": {
                "maxIncome": 200000,
                "courseLevels": ["12th", "UG", "PG"]
              }
            }
          ]
        }
      }
    }

## Tool 4: check_eligibility

- Visibility: app only
- Purpose: Verifies eligibility for one scheme
- Arguments:
  - schemeId string
  - profile object (same shape as above)

    {
      "jsonrpc": "2.0",
      "id": 14,
      "method": "tools/call",
      "params": {
        "name": "check_eligibility",
        "arguments": {
          "schemeId": "MOMA_POST_MATRIC",
          "profile": {
            "state": "Karnataka",
            "category": "EWS",
            "annualIncome": 600000,
            "courseLevel": "PG",
            "percentage": 82,
            "gender": "male",
            "disability": false
          }
        }
      }
    }

## Tool 5: generate_doc_bundle

- Visibility: app only
- Purpose: Builds checklist bundle for selected schemes
- Arguments:
  - schemeIds array of strings (at least 1)
  - studentId string

    {
      "jsonrpc": "2.0",
      "id": 15,
      "method": "tools/call",
      "params": {
        "name": "generate_doc_bundle",
        "arguments": {
          "schemeIds": ["MOMA_POST_MATRIC", "PM_USHA"],
          "studentId": "nihir"
        }
      }
    }

## Tool 6: show_doc_bundle

- Visibility: model, app
- Purpose: Opens App 3 with generated bundle
- Arguments:
  - bundle.studentId string
  - bundle.schemes string[]
  - bundle.documents[] with:
    - name string
    - forSchemes string[]
    - available boolean
    - mockUrl optional string

    {
      "jsonrpc": "2.0",
      "id": 16,
      "method": "tools/call",
      "params": {
        "name": "show_doc_bundle",
        "arguments": {
          "bundle": {
            "studentId": "nihir",
            "schemes": ["MOMA_POST_MATRIC", "PM_USHA"],
            "documents": [
              {
                "name": "Aadhaar Card",
                "forSchemes": ["MOMA_POST_MATRIC", "PM_USHA"],
                "available": true,
                "mockUrl": "https://example.com/docs/aadhaar.pdf"
              }
            ]
          }
        }
      }
    }

## 4) App-to-Host UI Commands (inside embedded MCP apps)

These are used by the iframe apps in this project.

- ui/initialize
- ui/notifications/initialized
- ui/update-model-context
- tools/call

Host can send data to app via:

- ui/notifications/tool-input

## 5) Resource URIs in this project

- ui://anyverse/profile-form
- ui://anyverse/schemes-dashboard
- ui://anyverse/doc-bundle-viewer

## 6) Minimal Working Call Sequence

1. initialize
2. notifications/initialized
3. tools/call with name build_student_profile
4. (inside app) tools/call with name fetch_opportunities
5. tools/call with name show_schemes_dashboard
6. (inside dashboard) tools/call check_eligibility or generate_doc_bundle
7. tools/call show_doc_bundle

