# HAWK Pentest Platform — TODO

## Database & Schema
- [x] Create targets table (domain, status, scope, authorized_date)
- [x] Create findings table (target_id, title, severity, cwe, cvss, evidence, remediation)
- [x] Create recon_results table (target_id, stage, status, output_json)
- [x] Create reports table (target_id, title, content, created_at)
- [x] Create conversations table (user_id, messages_json)
- [x] Create owasp_knowledge table (category, description, examples, checklist)
- [x] Run migrations via webdev_execute_sql

## Backend API Routes (tRPC)
- [x] recon.startPipeline — Validate scope, trigger deterministic engine
- [/] recon.getStatus — Return status based on db records (needs live polling)
- [x] recon.getResults — Fetch completed recon results
- [x] vulnerability.analyze — Hardened analysis via Python engine
- [/] reports.generate — Create formatted bug bounty report (basic markdown)
- [x] reports.list — Fetch user's past reports
- [x] chat.sendMessage — AI mentor conversation with local context
- [ ] owasp.getCategory — Fetch OWASP Top 10 details (needs db prep)
- [x] targets.list — List all user targets
- [x] targets.create — Add new target with scope validation
- [ ] targets.delete — Remove target

## Frontend UI Components
- [x] DashboardLayout customization (dark cyberpunk theme)
- [x] ReconEngine panel with URL input and pipeline visualizer
- [x] VulnerabilityAnalyzer panel with HTTP data input
- [x] ReportBuilder panel with form fields
- [x] AIMentor chat interface (reuse AIChatBox component)
- [x] OWASPMap interactive grid
- [x] SeverityBadge component (Critical, High, Medium, Low, Info)
- [x] CodeBlock component for monospace output
- [x] PipelineStage visualizer with live status

## Features
- [x] Recon pipeline stages: scope check → DNS/WHOIS → tech stack → attack surface → AI reasoning → test plan
- [x] Vulnerability severity color coding (Critical=#red, High=#orange, Medium=#blue, Low=#green, Info=#gray)
- [x] Structured JSON output for findings
- [x] OWASP Top 10 interactive grid with AI explanations
- [x] Tool guides: Burp Suite, Nmap, FFUF, SQLmap, Nuclei (in AI Mentor system prompt)
- [x] Persistent session history per user
- [x] Scope validation before recon
- [x] "Authorized only" indicator in UI
- [x] AI system prompt guardrails for ethical enforcement

## Styling & Theme
- [x] Dark cyberpunk color palette (dark grays, neon accents)
- [x] Monospace fonts for code/technical output
- [x] Responsive sidebar navigation
- [x] Pipeline stage visualizer styling
- [x] Severity badge color system
- [x] Smooth transitions and hover effects
- [x] Create Python Security Engine (Sovereign v2)
- [x] Implement Deterministic Recon (DNS, Ports, Tech)
- [x] **Evidence-First Architecture**: Capture raw request/response and banners
- [x] **Triage Center**: High-density operator UI for signal triage
- [x] Hardened SSRF Protection & Ethical Gates

## Roadmap (The Sovereign Evolution)

### Phase 1: Recon Correlation (The "Attack Map")
- [ ] **Correlation Engine**: Link tech stack identification to specific vulnerability templates.
- [ ] **Historical Diffing**: Snapshotting recon results to identify new/removed assets.
- [ ] **Secret Scanning**: Integrate `trufflehog` or custom regex for exposed keys.

### Phase 2: Workflow Compression
- [ ] **Validation Agent**: AI suggests commands to reproduce findings -> Engine executes -> Evidence captured.
- [ ] **One-Click Remediation**: Generate patches or config fixes directly from findings.
- [ ] **Keyboard-Driven UI**: `j/k` navigation for the Triage Center.

## Testing & Validation
- [ ] Unit tests for recon pipeline logic
- [ ] Integration tests for API routes
- [ ] UI component tests
- [ ] Ethical enforcement validation

## Sovereign Hardening (The Roast Response)
- [x] Fix HAWKDashboard syntax errors and contract drift
- [x] Add SSRF protection to Python engine (RFC1918 block)
- [x] Add API Key auth between Node and Python
- [x] Fix Scrapling import and service lookup errors
- [x] Purge Manus template leftovers (Map, ImageGen, etc.)
- [/] Implement real Wappalyzer-grade tech detection
- [ ] Add Docker Compose for one-click sovereign deploy
- [ ] Cryptographically sign ethical permission logs
