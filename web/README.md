# SkillRise — Production-Ready Web App

End-to-end Next.js 16 application covering the full product: marketing site, auth, learner/teacher/teen/employer/school/admin dashboards, AI tutor, live sessions, SkillFeed, certificates, and jobs board.

This README gives you the TL;DR. Deep setup lives in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## Quickstart

```bash
cp .env.example .env.local
npm install
npm run dev     # http://localhost:3000
```

All demo accounts use the password `demo1234`.

| Role | Email |
| --- | --- |
| Learner | `tanya@skillrise.app` |
| Learner | `rico@skillrise.app` |
| Teen (Youth Zone) | `sofia@skillrise.app` |
| Teacher | `john@skillrise.app` |
| Teacher | `maya@skillrise.app` |
| Teacher (youth) | `sarah@skillrise.app` |
| Employer | `apex@skillrise.app` |
| Employer | `citymedical@skillrise.app` |
| School | `centralhs@skillrise.app` |
| Admin | `admin@skillrise.app` |

---

## What's in here

### UI / UX
- **Dark + light + system theme** via CSS variables (`app/globals.css`) and `components/theme/theme-provider.tsx`. No flash on load (inline script in `<head>` applies the saved theme before hydration).
- **Redesigned landing** with hero, features overview, testimonials, and an About Me section driven by `lib/about.ts`.
- **Redesigned dashboard** with stat widgets, inline SVG sparkline analytics, quick actions, activity feed, and role-aware layouts.
- **Streaming AI Tutor** (`components/assistant-chat.tsx`) — real OpenAI streaming or a smart curriculum-aware mock.
- **Micro-interactions**: reveal-on-scroll, glass nav, hover-lift cards, subtle floaty mockups, focus rings.

### Security (production-grade)
- `bcryptjs` (cost 12) for password hashing — `lib/security/password.ts`
- `zod` validation on every API route — `lib/validators/index.ts`
- LRU in-process rate limiting — `lib/security/rate-limit.ts`
- CSP + HSTS + Frame-Options + Permissions-Policy via edge middleware — `middleware.ts`
- HTTP-only, SameSite=Lax, Secure cookies with 192-bit random session tokens

### Data layer — pluggable
Switch with `DATA_STORE=memory|mongodb|dynamodb`:
- **Memory** (default): seeds a realistic demo on boot
- **MongoDB**: `lib/db/mongodb.ts` — auto-creates indexes, TTL sessions, unique email
- **DynamoDB**: `lib/db/dynamodb.ts` — single-table design with GSI1

All three share the `DbAdapter` contract in `lib/db/types.ts`. The service layer and auth never touch a DB directly — they go through `getDb()`.

### AI Tutor
- Real OpenAI streaming when `OPENAI_API_KEY` is set (default model `gpt-4o-mini`, override with `OPENAI_MODEL`).
- Context-aware system prompt uses the learner's active track, modules, and bio.
- Graceful fallback to a curriculum-specific mock when no key is present.

### Cloud infrastructure (`infra/terraform/`)
One-command AWS deploy:
- DynamoDB single-table with PITR + SSE
- S3 bucket (encrypted, versioned, CORS, blocked public access)
- Cognito user pool + hosted UI
- ECR with lifecycle policy and immutable tags
- App Runner with auto-scaling and health checks
- CloudWatch log group + 5xx alarm
- Scoped IAM roles + Secrets Manager entries for `OPENAI_API_KEY` / `MONGODB_URI`

Container image: multi-stage `Dockerfile` using Next.js standalone output, runs as a non-root user, with a built-in health check.

---

## Route map

### Public
- `/` landing (hero, features, mission, audiences, SkillFeed preview, youth, testimonials, **About Me**, pledge, employers, download)
- `/about` full About Me page
- `/login`, `/signup?role=teacher|teen|employer|school`
- `/verify`, `/cert/[id]` — public certificate verification
- `/privacy`

### Authenticated (route group `(app)/`, role-gated)
- `/dashboard` — role-aware with widgets, charts, quick actions
- `/tracks`, `/tracks/[slug]`, `/learn/[slug]/[moduleId]`
- `/feed` — SkillFeed
- `/live` — live sessions
- `/jobs`, `/jobs/[id]`
- `/cert` — your certificates
- `/assistant` — **AI Tutor (streaming)**
- `/cohort`, `/challenge`, `/profile`
- Teacher: `/teach`, `/teach/record`, `/teach/live`
- Employer: `/employers/dashboard`, `/employers/post`
- School: `/schools/dashboard`
- Admin: `/admin`

### API (all validated + rate-limited where sensitive)
Auth: `signup`, `login`, `logout`, `me`
Learn: `enrollments`, `progress`
Social: `feed`, `feed/[id]/like`, `feed/[id]/comment`
Live: `live`, `live/[id]/rsvp`
Jobs: `jobs`, `jobs/[id]/apply`, `applications/[id]`
Cohort: `cohort/[id]/message`
Challenge: `challenge/progress`
AI: `assistant` (streaming)
Profile: `me`, `me/export`
Public: `verify/[id]`

---

## Where to personalize

1. **Your About info** → `lib/about.ts` (name, tagline, bio, socials, projects, photo URL, email).
2. **Theme / palette** → CSS variables in `app/globals.css` (dark and light blocks). Every component consumes them, so one edit cascades site-wide.
3. **Footer links** → `lib/data.ts` (`footerLinks`, `navLinks`).

---

## Testing the security path

```bash
# Weak password is rejected with field-level errors
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"x@x.com","password":"short","role":"learner"}'

# Rate limit fires after 10 failed logins in 15 minutes (HTTP 429)
for i in $(seq 1 12); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@nowhere.io","password":"wrong"}'
done
```

---

## Scripts

```bash
npm run dev           # dev server
npm run build         # production build (emits .next/standalone)
npm run start         # start production build locally
npx tsc --noEmit      # type-check
docker build -t skillrise .   # container image
```

---

## Architecture map

```
web/
├── app/                    # Next.js app router
│   ├── (app)/              # auth-gated route group (uses AppShell)
│   ├── api/                # validated route handlers
│   ├── about/              # public About Me page
│   ├── layout.tsx          # ThemeProvider + SEO + fonts
│   └── globals.css         # CSS variables (dark + light)
├── components/
│   ├── theme/              # ThemeProvider, ThemeToggle
│   ├── about/              # AboutSection, SocialIcon, AboutAvatar
│   ├── dashboard/          # StatWidget, SparkChart, ActivityFeed, QuickActions
│   └── …                   # landing, feed, tracks, employer, school, admin
├── lib/
│   ├── db/                 # adapter interface + memory, mongodb, dynamodb
│   ├── services/           # assistant-service (OpenAI + mock)
│   ├── security/           # password, rate-limit, headers
│   ├── validators/         # Zod schemas
│   ├── about.ts            # About Me config
│   ├── auth.ts             # session management (cookie → DbAdapter)
│   └── store.ts            # in-memory seed data (used by memory adapter)
├── middleware.ts           # edge middleware for security headers
├── Dockerfile              # multi-stage, standalone, non-root
├── infra/terraform/        # AWS IaC (DynamoDB, S3, Cognito, ECR, App Runner, CloudWatch)
├── DEPLOYMENT.md           # step-by-step deploy guide
└── .env.example            # every env var the app reads
```

---

## Philosophy

Everything defaults to working out-of-the-box with zero credentials:
- No OpenAI key → smart mock tutor
- No Mongo/Dynamo → in-memory store with realistic seeds
- No AWS → `npm run dev` is all you need

Add credentials one at a time and the app transparently upgrades each layer. No rewrite, no opt-in config maze.
