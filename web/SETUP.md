# SkillRise — Setup & API Key Checklist

This document is the definitive "what do I need to do on my end" guide for running
SkillRise locally and in production. It covers:

1. Local development (0 keys required — every external integration has a mock fallback)
2. Which API keys unlock which features
3. Hosting / deploy options
4. A copy-pasteable `.env.local` template

---

## 1. Zero-config local dev

You can run the entire app with **no API keys** and no database. Every external
integration has a mock fallback:

```bash
cd web
npm install
npm run dev
# open http://localhost:3000
```

Demo accounts (all use password `demo1234`):

| Role     | Email                         |
| -------- | ----------------------------- |
| Learner  | tanya@skillrise.app           |
| Teen     | sofia@skillrise.app           |
| Teacher  | john@skillrise.app            |
| Employer | hiring@apexelectric.com       |
| School   | careers@centralhs.edu         |

Without keys you get: mocked AI Tutor responses, a curated catalog for the
learner skill-search (no live YouTube), in-memory data (resets on restart).

---

## 2. API keys by feature

### 2.1 AI Tutor — `OPENAI_API_KEY` (optional)

Powers the streaming tutor on `/assistant` and the ⌘K command-palette.

- Where to get it: <https://platform.openai.com/api-keys>
- Env:
  - `OPENAI_API_KEY=sk-...`
  - `OPENAI_MODEL=gpt-4o-mini` (default — any chat-completion model works)
- Without it: the tutor returns a templated canned response so the UI still functions.

### 2.2 Learner skill-search — `YOUTUBE_API_KEY` (optional)

Turns the dashboard's "search any skill" bar into a live YouTube search.

- Where to get it:
  1. <https://console.cloud.google.com/> → create a project
  2. Enable **YouTube Data API v3**
  3. APIs & Services → Credentials → **Create API key**
  4. Restrict to "YouTube Data API v3" for safety
- Env: `YOUTUBE_API_KEY=AIza...`
- Free tier: 10,000 quota units / day (≈ 100 searches).
- Without it: falls back to a curated offline catalog.

### 2.3 Database — choose ONE

The app auto-detects the backend via `DATA_STORE`:

| `DATA_STORE`  | Required env                                       | Use when          |
| ------------- | -------------------------------------------------- | ----------------- |
| `memory`      | none                                               | local dev / demos |
| `mongodb`     | `MONGODB_URI`, `MONGODB_DB` (default `skillrise`)  | self-hosted prod  |
| `dynamodb`    | `AWS_REGION`, `DYNAMO_TABLE`, AWS credentials      | AWS prod          |

#### MongoDB (recommended for simplicity)

- Sign up at <https://www.mongodb.com/cloud/atlas> (free M0 tier works)
- Create a cluster → add a database user → allow your IP or `0.0.0.0/0`
- Copy the connection string
- Env:
  ```
  DATA_STORE=mongodb
  MONGODB_URI=mongodb+srv://USER:PASS@cluster.mongodb.net
  MONGODB_DB=skillrise
  ```

#### DynamoDB (recommended for full AWS stack)

- Create a table named `skillrise` with:
  - Partition key: `pk` (String)
  - Sort key: `sk` (String)
  - Global Secondary Index named `GSI1` on `gsi1pk` (String) / `gsi1sk` (String)
- Env:
  ```
  DATA_STORE=dynamodb
  AWS_REGION=us-east-1
  DYNAMO_TABLE=skillrise
  AWS_ACCESS_KEY_ID=AKIA...        # or use an IAM role
  AWS_SECRET_ACCESS_KEY=...
  ```
- Terraform at `infra/terraform/` provisions this automatically.

### 2.4 File uploads (future) — S3 (optional today)

The teacher Upload Zone currently simulates uploads client-side. To persist real
video uploads, add S3 later:

- Env:
  ```
  AWS_S3_BUCKET=skillrise-uploads
  AWS_REGION=us-east-1
  # reuses AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
  ```
- Currently no keys are required because Upload Zone is simulated only.

### 2.5 Auth (current + future)

- **Today:** SkillRise uses its own opaque session cookies + bcrypt-hashed
  passwords. **No external auth key required.** Security is handled by
  `lib/auth.ts`, `lib/security/password.ts`, `lib/security/rate-limit.ts`,
  and `proxy.ts` (security / pathname headers for rate limiting and CSP).
- **If you later want AWS Cognito / Google / GitHub:** set up a Cognito User
  Pool and an App Client, then add:
  ```
  COGNITO_USER_POOL_ID=...
  COGNITO_CLIENT_ID=...
  COGNITO_REGION=us-east-1
  ```
  (not wired yet — we can add this on request.)

### 2.6 Email (future, optional)

Not wired yet. If/when password-reset / magic-link emails ship, you'll need one of:

- Resend: `RESEND_API_KEY=re_...`
- SendGrid: `SENDGRID_API_KEY=SG....`
- AWS SES: `AWS_SES_FROM=...`

---

## 3. What you need to do — checklist

Do these in order. Everything marked **Optional** means the app still runs, just
with the mock/offline fallback.

- [ ] **Node.js 20+** installed (`node -v`)
- [ ] `cd web && npm install`
- [ ] Copy `.env.example` below to `web/.env.local` (create the file)
- [ ] **Optional:** paste an `OPENAI_API_KEY` to enable real AI tutor
- [ ] **Optional:** paste a `YOUTUBE_API_KEY` to enable live skill search
- [ ] **Optional (prod):** point `DATA_STORE` at MongoDB or DynamoDB + creds
- [ ] Run `npm run dev` locally → visit <http://localhost:3000>
- [ ] Run `npm run build && npm start` to smoke-test production bundle
- [ ] **Deploy (pick one):**
  - Vercel (easiest): push to GitHub, import in Vercel, paste env vars
  - AWS App Runner via the included Terraform (`infra/terraform`)
  - Any Docker host: the repo's `Dockerfile` outputs a standalone image
- [ ] Configure your domain's DNS → hosting provider
- [ ] Enable HTTPS (automatic on Vercel / App Runner)

---

## 4. `.env.local` template

Copy into `web/.env.local`. Everything is optional — leave a key blank to use
the mock fallback.

```dotenv
# ---------- AI Tutor ----------
# OPENAI_API_KEY=sk-REPLACE
# OPENAI_MODEL=gpt-4o-mini

# ---------- Learner skill-search ----------
# YOUTUBE_API_KEY=AIzaSy-REPLACE

# ---------- Data store ----------
# memory | mongodb | dynamodb
DATA_STORE=memory

# Mongo (only if DATA_STORE=mongodb)
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net
# MONGODB_DB=skillrise

# DynamoDB (only if DATA_STORE=dynamodb)
# AWS_REGION=us-east-1
# DYNAMO_TABLE=skillrise
# AWS_ACCESS_KEY_ID=AKIA-REPLACE
# AWS_SECRET_ACCESS_KEY=REPLACE
```

---

## 5. Security

No extra keys required for security — the following is already in place:

- bcrypt password hashing (`lib/security/password.ts`)
- Opaque cookie sessions (`lib/auth.ts`) — `httpOnly`, `secure` in prod, `sameSite=lax`
- IP-based rate-limiting (`lib/security/rate-limit.ts`) — 10 login attempts / 15 min
- Security headers (CSP, X-Content-Type-Options, Referrer-Policy — `lib/security/headers.ts`)
- Zod schema validation on every mutating API route

If you want to tighten further: put Cloudflare or AWS WAF in front of the app;
nothing in the app needs to change.

---

## 6. Responsive design guarantees

The UI ships with these breakpoints (see `tailwind.config.ts`):

| Token  | Min width | Intent                                                |
| ------ | --------- | ----------------------------------------------------- |
| `xs`   | 420px     | Small phones — avoid cramped buttons                  |
| `sm`   | 640px     | Large phones                                          |
| `md`   | 768px     | Tablets portrait                                      |
| `lg`   | 1024px    | Tablets landscape / small laptops                     |
| `xl`   | 1280px    | Desktops                                              |
| `2xl`  | 1536px    | Large desktops                                        |
| `3xl`  | 1920px    | 1080p+ / ultrawide — extra columns + side rails kick in |
| `4k`   | 2560px    | 4K panels — dashboards expand up to 2000–2400px wide  |

Dashboards use `.dash-wrap` (caps 1680/2000/2240px at `md/3xl/4k`) so they grow
into extra screen real-estate instead of leaving empty white space, and all
tables/kanbans collapse gracefully on mobile (horizontal scroll-snap).
