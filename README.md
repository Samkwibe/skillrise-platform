# SkillRise

Learning platform. The **Next.js** app is in [`web/`](web/).

## Develop locally

1. `cd web && npm install`
2. Copy `web/.env.example` to `web/.env.local` and configure (never commit secrets).
3. `npm run dev` → [http://localhost:3000](http://localhost:3000)

## GitHub (Samkwibe)

Repository: [github.com/Samkwibe/skillrise-platform](https://github.com/Samkwibe/skillrise-platform). Remote: `git@github.com:Samkwibe/skillrise-platform.git` (`origin`).

**AWS App Runner (Git):** **Source directory** = `web`, and under **Configure build** choose **Use a configuration file** → `apprunner.yaml` (otherwise `npm ci` never runs and you get `next: command not found`). Details: [`web/DEPLOYMENT.md`](web/DEPLOYMENT.md#6-aws-app-runner-git-source-monorepo).
