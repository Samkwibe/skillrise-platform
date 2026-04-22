# Deployment Guide

This repo ships with everything you need to run SkillRise locally, in Docker, or fully on AWS.

---

## 1. Local development

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app runs at http://localhost:3000 with the **in-memory** data store and a **mock AI tutor**. Demo users live in `lib/store.ts` (password: `demo1234` for every seed account).

---

## 2. Enable the real AI Tutor

Set this in `.env.local`:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini   # optional
```

Restart `npm run dev`. The AI Tutor at `/assistant` now streams real responses. Without the key, it falls back to a curriculum-aware mock.

---

## 3. Switch to MongoDB Atlas

```bash
DATA_STORE=mongodb
MONGODB_URI="mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true"
MONGODB_DB=skillrise
```

The MongoDB adapter auto-creates all indexes on first connect (`lib/db/mongodb.ts`). Existing seed data lives only in the Memory adapter — run a one-off migration script if you need seed users in Mongo.

---

## 4. Switch to DynamoDB (AWS)

```bash
DATA_STORE=dynamodb
AWS_REGION=us-east-1
DYNAMO_TABLE=skillrise-prod-table
```

You'll also need the standard AWS credentials chain (`~/.aws/credentials`, IAM role, or env vars). The table layout is single-table design — see `lib/db/dynamodb.ts` for the schema and required GSI.

---

## 5. Docker build

```bash
docker build -t skillrise:dev .
docker run -p 3000:3000 \
  -e DATA_STORE=memory \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  skillrise:dev
```

The image is multi-stage, uses Next.js standalone output, and runs as a non-root user with a health check on `/api/auth/me`.

---

## 6. AWS App Runner (Git source, monorepo)

The Next.js app lives in **`web/`** at the repo root (e.g. `Samkwibe/skillrise-platform`). If App Runner is connected to that repository, set:

| Setting | Value |
|--------|--------|
| **Source directory** | `web` (not `/` or empty) |
| **Configuration file** | Optional: use the repo’s `apprunner.yaml` inside `web/` (already committed) |

If **Source directory** is left as repository root, the build will fail (`package.json` is only under `web/`) with errors like *Failed to execute 'build' command*.

The included [`apprunner.yaml`](apprunner.yaml) runs `npm ci`, `npm run build`, and `npm start` on port `3000`, with extra Node heap for the build. **You do not need any env vars for the build step** to succeed (we confirmed `npm run build` works with no `.env.local` or `.env.production`).

### If the build still fails

The console message *Failed to execute 'build' command* is generic. Get the real error from **CloudWatch**: App Runner → your service → **Logs** → build log group (or **Observability** → **CloudWatch**), and open the log stream for the failed deployment (e.g. ID `cde19817-…`).

**CLI (replace region, log group, stream as shown in the App Runner / CloudWatch console):**
```bash
aws logs filter-log-events \
  --region us-east-1 \
  --log-group-name "SERVICE_LOG_GROUP_FROM_CONSOLE" \
  --filter-pattern "error" \
  --limit 50
```

Common causes: **out of memory** (we set `NODE_OPTIONS=--max-old-space-size=3072` in `apprunner.yaml`), **`npm ci` vs lockfile** (run `npm ci` locally in `web/` to verify), or **Node runtime** (`runtime: nodejs22` in `apprunner.yaml`).

---

## 7. Deploy to AWS (Terraform + ECR + App Runner image)

Everything Terraform needs lives in `infra/terraform/` (container **image** deploy, not Git source from root):

- **DynamoDB** single-table (`skillrise-<env>-table`) with GSI1 for email/secondary lookups
- **S3** bucket for uploads (encryption + versioning + CORS)
- **Cognito** user pool and client for managed auth
- **ECR** repository with lifecycle policy
- **App Runner** service (auto-scaling, HTTPS, health-checked)
- **CloudWatch** log group + 5xx alarm
- **IAM** scoped roles for task + ECR access
- **Secrets Manager** for `OPENAI_API_KEY` and `MONGODB_URI`

### One-time setup

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars   # edit as needed
terraform init
terraform apply
```

Grab the outputs:

```bash
terraform output ecr_repository_url
terraform output app_url
```

### Push a container image

```bash
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin <ecr_repository_url>

docker build -t <ecr_repository_url>:v1 .
docker push <ecr_repository_url>:v1

# Then update Terraform with the new tag and re-apply:
terraform apply -var="app_image_tag=v1"
```

App Runner auto-deploys on new image pushes with the same tag (`auto_deployments_enabled = true`).

### Add your OpenAI key

```bash
aws secretsmanager put-secret-value \
  --secret-id skillrise-prod/openai-api-key \
  --secret-string 'sk-...'
```

App Runner will pick it up on the next deploy.

### Custom domain

Set `domain_name = "app.skillrise.dev"` in `terraform.tfvars`, then run `terraform apply`. Add the CNAME record App Runner gives you to your DNS provider.

---

## 8. Environment variables reference

| Variable | Where | Purpose |
|---|---|---|
| `NODE_ENV` | runtime | `production` or `development` |
| `DATA_STORE` | runtime | `memory` \| `mongodb` \| `dynamodb` |
| `OPENAI_API_KEY` | secret | Enables real AI Tutor streaming |
| `OPENAI_MODEL` | runtime | Default `gpt-4o-mini` |
| `MONGODB_URI` | secret | Required when `DATA_STORE=mongodb` |
| `MONGODB_DB` | runtime | Default `skillrise` |
| `AWS_REGION` | runtime | DynamoDB + Secrets Manager region |
| `DYNAMO_TABLE` | runtime | Single table name (from Terraform output) |
| `UPLOADS_BUCKET` | runtime | S3 bucket for uploads |
| `COGNITO_USER_POOL_ID` | runtime | Cognito pool ID |
| `COGNITO_CLIENT_ID` | runtime | Cognito client ID |
| `COGNITO_DOMAIN` | runtime | Hosted UI domain prefix |

---

## 9. Security checklist

- Passwords are bcrypt-hashed (`bcryptjs`, cost 12) — never stored plaintext.
- All auth routes are rate-limited (`lib/security/rate-limit.ts`) and validated with Zod.
- Edge middleware (`middleware.ts`) adds CSP, HSTS, Frame-Options, Permissions-Policy.
- Sessions are HTTP-only, Secure, SameSite=Lax; tokens are 192-bit random.
- Secrets live in AWS Secrets Manager, **never** in the container image.
- ECR scans every image on push; `IMMUTABLE` tag policy prevents silent rewrites.
- S3 bucket: public access fully blocked + AES256 encryption + versioning + CORS.
- DynamoDB: point-in-time recovery + server-side encryption.

---

## 10. Observability

- App Runner streams stdout/stderr to CloudWatch (`/aws/apprunner/skillrise-<env>`).
- 5xx alarm fires when the service returns >5 errors/minute (2 consecutive periods).
- Add an SNS topic to `aws_cloudwatch_metric_alarm.http_5xx.alarm_actions` to page on-call.

---

## 11. Tearing it down

```bash
cd infra/terraform
terraform destroy
```

⚠️ The S3 bucket has `force_destroy = false`. Empty it manually first, or flip the flag.
