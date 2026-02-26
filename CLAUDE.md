# CLAUDE.md - Antigravity Kit Integration

> This file configures Claude Code to use the Antigravity Kit agent & skill system located in `.agent/`.

---

## CRITICAL: READ FIRST

**At the start of every session, read:**
1. `.agent/ARCHITECTURE.md` → Full map of agents, skills, scripts
2. Any existing plan files (`docs/PLAN.md` or `{task-slug}.md`) if the task is complex

---

## AGENT ROUTING (MANDATORY)

Before ANY code or design work, identify and apply the correct specialist agent:

| Domain | Agent File | Triggers |
|--------|-----------|----------|
| Web UI/UX, React, Tailwind | `.agent/agents/frontend-specialist.md` | component, UI, UX, CSS, responsive, hook |
| Backend, API, server logic | `.agent/agents/backend-specialist.md` | API, endpoint, server, database, auth |
| Database schema, ORM | `.agent/agents/database-architect.md` | schema, migration, Prisma, SQL, query |
| Security audit | `.agent/agents/security-auditor.md` | security, vulnerability, OWASP, auth review |
| Debugging | `.agent/agents/debugger.md` | bug, error, crash, not working, fix |
| Performance | `.agent/agents/performance-optimizer.md` | slow, optimize, Web Vitals, bundle |
| Testing | `.agent/agents/test-engineer.md` | test, coverage, E2E, unit, Playwright |
| Planning | `.agent/agents/project-planner.md` | plan, roadmap, breakdown, feature scope |
| Multi-domain tasks | `.agent/agents/orchestrator.md` | complex tasks spanning multiple domains |
| Mobile (RN/Flutter) | `.agent/agents/mobile-developer.md` | mobile, iOS, Android, React Native |
| DevOps, CI/CD | `.agent/agents/devops-engineer.md` | deploy, Docker, CI/CD, pipeline |

### Protocol
1. **Analyze** the request domain (silent)
2. **Read** the matching agent `.md` file
3. **Announce** which agent expertise you're applying:
   ```
   🤖 Applying knowledge of `@[agent-name]`...
   ```
4. **Apply** the agent's rules and load its required skills

---

## SKILLS SYSTEM

Agents reference skills from `.agent/skills/`. Load them selectively:

- Read `SKILL.md` in the skill folder first (index file)
- Only read the specific sections relevant to the request
- **Do NOT** read all files in a skill folder unless required

Key skills by domain:
- **Frontend:** `react-best-practices`, `tailwind-patterns`, `frontend-design`, `web-design-guidelines`
- **Backend:** `api-patterns`, `nodejs-best-practices`, `python-patterns`
- **Database:** `database-design`, `prisma-expert`
- **Quality:** `clean-code`, `testing-patterns`, `lint-and-validate`
- **Security:** `vulnerability-scanner`
- **Design:** `ui-ux-pro-max` (50 styles, 21 palettes, 50 fonts)

---

## UNIVERSAL RULES (Always Active)

### Language
- Respond in the user's language (currently Spanish)
- Code, variables, and comments remain in English

### Clean Code
All code must follow `.agent/skills/clean-code/SKILL.md`. No exceptions:
- Concise, self-documenting, no over-engineering
- No `any` in TypeScript
- No `console.log` left in production code

### Request Classification

| Type | Action |
|------|--------|
| Question / Explain | Answer directly, no agent routing needed |
| Simple fix (1 file) | Apply relevant agent lite rules, edit inline |
| Build / Create / Refactor | Read full agent file + skills, announce agent |
| UI / Design | Read `frontend-specialist.md` + `ui-ux-pro-max` skill |
| Multi-domain | Use orchestrator protocol |

### Socratic Gate (Complex Requests)
For new features or vague requests, ask 2-3 targeted questions before implementing:
- Scope, constraints, tech preferences
- **Wait for answers** before writing code

---

## DESIGN RULES (Frontend/UI Work)

Enforced by `frontend-specialist` agent:

- **Purple Ban:** Never use purple/violet/indigo as primary color
- **No default layouts:** Avoid "Standard Hero Split", Bento Grids, Glassmorphism
- **No default libraries:** Never auto-add shadcn, Radix, Chakra without asking
- **Animation required:** Static UI = failure. Add scroll-triggered reveals + micro-interactions
- **Deep Design Thinking:** Run internal cliché scan before any UI work

---

## VALIDATION SCRIPTS

Run these when appropriate:

```bash
# Quick audit during development
python .agent/scripts/checklist.py .

# Full pre-deploy verification
python .agent/scripts/verify_all.py . --url http://localhost:3000
```

Priority order: Security → Lint → Schema → Tests → UX → SEO → Lighthouse/E2E

---

## PROJECT CONTEXT

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS (CDN), Firebase (Auth + Firestore)
- **Primary agent for this project:** `frontend-specialist`
- **Auth:** Firebase Email/Password via `AuthContext`
- **Data:** Firestore real-time listeners in `App.tsx`
- **Styling:** Tailwind via CDN in `index.html` (no PostCSS build step)

---

## AGENT FILES REFERENCE

All agents: `.agent/agents/`
All skills: `.agent/skills/`
All scripts: `.agent/scripts/` + `.agent/skills/<skill>/scripts/`
Architecture map: `.agent/ARCHITECTURE.md`
