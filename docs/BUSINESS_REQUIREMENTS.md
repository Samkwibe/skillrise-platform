# SkillRise — Business Requirements (BRD)

**Tagline:** Learn. Teach. Rise Together.
**Source of truth for UI/UX:** `../skillrise-platform-website.html`
**Predecessor BRD:** `../skillrise-brd.html` (v1.0). This document **supersedes** it and reconciles conflicts noted in §13.
**Status:** Draft v2 — aligned to website copy and flows.
**Version:** 2.0
**Date:** April 2026

---

## 0. Reading guide

Every requirement below has an ID:
`BR-<AREA>-<NNN>` where AREA is one of `PLAT, LEARN, FEED, TEACH, CERT, JOBS, YOUTH, PLEDGE, EMP, SCHOOL, ADMIN, A11Y, MKT`.
The same IDs are reused in `TECHNICAL_REQUIREMENTS.md`.

Priority uses **MoSCoW**: `Must / Should / Could / Won’t v1`.

---

## 1. Vision and positioning

| Item | Description |
|------|-------------|
| **Product** | SkillRise — free platform to **learn a practical skill, get certified, get hired**, or **teach for free** to lift your community. |
| **North-star statement** | "*Stop scrolling. Start rising.*" Replace passive screen time with purposeful learning that leads to employment. |
| **Primary value prop — learners** | Learn → certify → get hired locally, in 3–8 weeks. Free to start. |
| **Primary value prop — teachers** | Share your skill in 30 minutes, record on your phone, track real-world impact. No pay, your legacy is the impact. |
| **Primary value prop — teens (13–18)** | Age-appropriate tracks, school-recognized certs, portfolio for college & jobs — replacing social media time. |
| **Primary value prop — employers** | Pre-certified, community-invested candidates with a **90-day guarantee**; 11-day average time-to-hire. |
| **Commercial stance** | 100% free for learners, teachers, teens, schools. Revenue comes from **employers**, not ads, not learners. |
| **Brand voice** | Direct, humane, action-oriented, anti-doom-scroll. |

---

## 2. Personas

### 2.1 Learner (adult, primary)
- **Context:** retail / hourly / unemployed / career-change; mobile-first; time-poor.
- **JTBD:** *"When I’m stuck in a job that doesn’t pay, I want to learn a real skill on my phone, so I can get a better local job fast."*
- **Success:** certificate earned ≤ 8 weeks; interview ≤ 90 days; wage uplift documented.

### 2.2 Volunteer Teacher
- **Context:** skilled professional (electrician, coder, nurse, chef, coach) with 30 min to give.
- **JTBD:** *"When I know something useful, I want to record a short lesson and help my neighborhood, so my knowledge has a legacy."*
- **Success:** at least one lesson published; impact metric visible (students, hires attributed).

### 2.3 Teen / High-school student (13–18)
- **Context:** heavy social media use; unsure about future; wants autonomy.
- **JTBD:** *"Instead of scrolling, I want to build something real — a skill, a portfolio, maybe my first income."*
- **Success:** 30-day challenge completed; first certificate; school-recognized credit where applicable.

### 2.4 Employer (local business)
- **Context:** SME in trades, healthcare support, hospitality, logistics, tech; frustrated by job-board noise.
- **JTBD:** *"When I need to hire quickly, I want pre-certified local candidates, so I can stop sorting résumés."*
- **Success:** job filled ≤ 11 days; 90-day retention covered by guarantee.

### 2.5 School / Career educator
- **Context:** underfunded career-ed program; looking for an assignable, trackable resource.
- **JTBD:** *"I want to assign SkillRise in career class and track students, so they leave school with a credential."*
- **Success:** cohort dashboard; certificates awarded; post-school placements.

### 2.6 Platform admin / Editorial
- **Context:** internal team handling content QA, safety (especially Youth Zone), certification integrity, employer verification.

---

## 3. Scope — website v1 (matches `skillrise-platform-website.html`)

The **marketing website** MUST render these sections, in this order, with the copy and CTAs from the HTML file. All section IDs below correspond to anchors in the HTML.

| Website section ID | Purpose | Required CTAs | Priority |
|--------------------|---------|---------------|----------|
| `BR-MKT-001` Nav + sticky header | Brand, primary nav, `Get started free` | `Get started free` | Must |
| `BR-MKT-002` Hero (`.hero`) | Headline "Stop scrolling. Start rising.", phone mockup with SkillFeed preview | `Start learning free`, `Teach for free` | Must |
| `BR-MKT-003` Movement strip | Counters: volunteer teachers, lives changed, free forever, graduates hired, scrolling replaced | — | Must |
| `BR-MKT-004` Mission (`#mission`) | Why we exist; Before/After evening comparison; graduate quote | — | Must |
| `BR-MKT-005` Three audiences | Learners / Volunteer Teachers / Teens cards with per-audience CTAs | 3 CTAs | Must |
| `BR-MKT-006` How teaching works (`#teach`) | 4-step flow (Record → Go live → Build course → See impact) | `Start teaching for free` | Must |
| `BR-MKT-007` SkillFeed preview | Three sample feed cards (Electrician, Financial Coach, Web Dev-Youth) | — | Must |
| `BR-MKT-008` Youth Zone (`#youth`) | Teen-facing copy, 4 track categories, **30-Day Social Media Swap Challenge**, School partnership block | `Join Youth Zone`, `For schools`, `Take the 30-day challenge` | Must |
| `BR-MKT-009` Stories (`#stories`) | 6 testimonials spanning learners, volunteer teachers, Youth Zone graduates | — | Must |
| `BR-MKT-010` The Pledge (`#pledge`) | 5-item pledge, signers counter | `Take the pledge` | Must |
| `BR-MKT-011` Impact numbers | Hours scrolling replaced, volunteers, youth graduates, hires, free | — | Must |
| `BR-MKT-012` Employers (`#employers`) | SME pitch, 11-day avg hire | `Post your first job free`, `Talk to our team` | Must |
| `BR-MKT-013` Download (`#download`) | App Store / Google Play badges + QR | Store links | Must |
| `BR-MKT-014` Footer | Platform / Community / Company link columns, legal | Privacy, Terms, Cookies | Must |
| `BR-MKT-015` Mobile menu | Full-screen overlay with full nav | — | Must |

**Scope exclusions for website v1:** blog, press kit beyond a placeholder, employer self-serve onboarding form (handled by sales), learner dashboard (lives in app, not marketing site).

---

## 4. Scope — product (app + app-equivalent web surfaces)

The marketing website drives visitors into **apps** and **logged-in web surfaces** for learners, teachers, teens, and employers.

### 4.1 Capability map

| ID | Capability | Clients | Priority |
|----|------------|---------|----------|
| BR-PLAT-001 | Global account (email / phone / Google / Apple); neighborhood selection | app + web | Must |
| BR-PLAT-002 | Age-gated experience (13–17 Youth Zone, 18+ default); under-13 blocked | app + web | Must |
| BR-PLAT-003 | Roles on one account: Learner, Teacher, Employer, School admin (multi-role allowed) | app + web | Must |
| BR-PLAT-004 | Offline support for enrolled course modules | app | Must |
| BR-PLAT-005 | Push + SMS notifications (job alerts, messages, reminders) | app | Must |
| BR-PLAT-006 | Daily screen-time reminder ("go practice") on **SkillFeed** | app | Must |
| BR-LEARN-001 | Browse/enroll in **Skill Tracks** (3–8 weeks); filter by category, duration, local job demand, age rating | app + web | Must |
| BR-LEARN-002 | Module playback with video, text, quiz, practical tasks | app + web | Must |
| BR-LEARN-003 | Local **cohort groups** tied to neighborhood + track | app + web | Must |
| BR-LEARN-004 | AI study assistant inside each module | app + web | Should |
| BR-FEED-001 | **SkillFeed**: vertical short-video feed of volunteer-taught lessons; no ads, no algorithm-trap pattern, daily usage cap reminder | app | Must |
| BR-FEED-002 | Feed cards show teacher, role, "Volunteer" badge, duration, watch counts, like/comment, Youth filter | app | Must |
| BR-FEED-003 | Live sessions — volunteer teachers host live classes for their neighborhood | app + web | Must |
| BR-TEACH-001 | **Record-on-phone** path: open camera → film → auto-captions → editorial review → publish | app | Must |
| BR-TEACH-002 | **Go-live path**: schedule / start live session in minutes | app | Must |
| BR-TEACH-003 | **Full-course path**: work with editorial team to build structured track (internal workflow) | web + internal | Should |
| BR-TEACH-004 | **Teacher impact dashboard**: students taught, completions, hires attributed | app + web | Must |
| BR-CERT-001 | Final assessment unlocks after all modules complete; 70% pass; retake after 48 h | app + web | Must |
| BR-CERT-002 | Assessment = knowledge quiz + practical task (photo/video/scenario) | app + web | Must |
| BR-CERT-003 | Identity verification (ID photo) before certificate issuance | app + web | Must |
| BR-CERT-004 | Cryptographically signed, verifiable certificate with unique ID; shareable link + PDF | app + web | Must |
| BR-CERT-005 | Public verification page — employer enters credential ID to confirm | web | Must |
| BR-CERT-006 | School-recognized certificates for Youth Zone tracks (opt-in by district) | web + internal | Should |
| BR-JOBS-001 | On certification, learner sees matched local jobs | app + web | Must |
| BR-JOBS-002 | One-tap apply — profile + certificate sent to employer | app + web | Must |
| BR-JOBS-003 | Employer posts jobs specifying required Skill Track(s), location, wage range | web | Must |
| BR-JOBS-004 | In-app messaging + interview scheduling | app + web | Must |
| BR-JOBS-005 | 90-day hire guarantee workflow (re-placement if hire fails within 90 days) | web + internal | Must |
| BR-JOBS-006 | Employer dashboard: applicants, hires, time-to-hire, re-hire rate | web | Must |
| BR-YOUTH-001 | Youth Zone home with age-appropriate tracks (13+, 15+, 16+) | app + web | Must |
| BR-YOUTH-002 | Tracks: coding/design/tech, money & business basics, trade basics, communication/public speaking | app + web | Must |
| BR-YOUTH-003 | Teen safety: no DMs from adult strangers, content moderation, guardian consent under 18 where required | app + web | Must |
| BR-YOUTH-004 | Portfolio feature — teens export projects for college/job applications | app + web | Should |
| BR-PLEDGE-001 | Take the Pledge flow (5 commitments, check signed, show running signer count) | app + web | Must |
| BR-PLEDGE-002 | **30-Day Social Media Swap Challenge** — daily streak, progress, reminders, reward at day 30 (first skill unlocked) | app | Must |
| BR-EMP-001 | Post job (free first job) | web | Must |
| BR-EMP-002 | Subscription for ongoing postings + candidate pool access | web | Must |
| BR-EMP-003 | Success-fee billing triggered when certified hire clears 30 days | web + internal | Must |
| BR-EMP-004 | Employer verification (business registration, address, trading status) | web + internal | Must |
| BR-EMP-005 | Co-design a Skill Track with editorial team (sponsored track, branding) | web + internal | Should |
| BR-SCHOOL-001 | School partnership program — assign SkillRise in career class, track student progress, award certs | web | Must |
| BR-SCHOOL-002 | School admin dashboard — class rosters, progress, cert completions, placements | web | Must |
| BR-ADMIN-001 | Admin / editorial dashboard — track approval, content QA, flagging, feed moderation | web (internal) | Must |
| BR-ADMIN-002 | Teacher onboarding / vetting workflow | web (internal) | Must |
| BR-ADMIN-003 | Analytics — enrollments, completions, certs, hires per track / neighborhood | web (internal) | Must |

### 4.2 Explicit non-goals for v1
- Paid learner tier. **SkillRise is free for learners forever.** (Overrides predecessor BRD `LEARN-premium`.)
- Display advertising of any kind.
- Open teacher publishing without editorial review.
- International expansion (English + Spanish only, US-first).

---

## 5. End-to-end journeys with acceptance criteria

### 5.1 Learner: "scrolling → hired"
1. Land on marketing site (`BR-MKT-002`) → tap `Start learning free`.
2. Install app, create account, pick neighborhood, take short goal quiz (`BR-PLAT-001`, `BR-LEARN-001`).
3. Browse tracks filtered by local job demand; enroll.
4. Complete modules (online / offline), use AI assistant, join cohort (`BR-LEARN-002..004`).
5. Take final assessment; pass 70%; verify ID; receive signed certificate (`BR-CERT-001..004`).
6. See matched local jobs; one-tap apply (`BR-JOBS-001..002`).
7. Interview in-app; get hired; 30-day success triggers employer success-fee (`BR-JOBS-004`, `BR-EMP-003`).

**Acceptance:**
- *Given* a new user, *when* they complete onboarding, *then* at least 5 matched tracks appear tied to their neighborhood.
- *Given* a learner with 100% module completion and verified ID, *when* they pass the final, *then* a verifiable certificate is issued within 30 s and the `Jobs matched for you` screen shows ≥ 1 local job or a clear "none yet" state with sign-up-for-alerts CTA.

### 5.2 Volunteer teacher: "record a phone lesson"
1. From marketing site `Teach for free` (`BR-MKT-006`) → install app → choose Teacher role.
2. Record short lesson on phone → auto-captions → submit (`BR-TEACH-001`).
3. Editorial reviews within SLA (see §9) → publish to SkillFeed.
4. Teacher sees real-time dashboard: students, hires attributed (`BR-TEACH-004`).

**Acceptance:**
- *Given* a submitted lesson, *when* editorial approves, *then* it appears in SkillFeed and the teacher gets a push notification with view/like counts updating ≤ 1 min from events.

### 5.3 Teen: "30-day swap"
1. Enter via Youth Zone (`BR-MKT-008`) → guardian consent flow if required by jurisdiction.
2. Pick age-appropriate track.
3. Start **30-Day Challenge**: daily 30 min SkillRise, streak, reminders.
4. Day 30: unlock first skill; Day 60: first certificate goal; Day 90: first income goal.

**Acceptance:**
- *Given* a teen with an active streak, *when* a day passes without a session, *then* a non-manipulative reminder fires once, not multiple times, not between 10pm and 7am local.

### 5.4 Employer: "post → hire in 11 days"
1. Employer section (`BR-MKT-012`) → `Post your first job free`.
2. Verify business (`BR-EMP-004`) → post role, tie to Skill Track(s), location, wage.
3. Receive applications from certified candidates; message, schedule interviews.
4. Hire → 30-day retention clock starts → success-fee billed.
5. If hire fails within 90 days → re-placement (`BR-JOBS-005`).

**Acceptance:**
- *Given* a verified employer posts a role tied to track `T`, *when* a learner certified in `T` in the same locality exists, *then* that learner is notified within 5 min.

### 5.5 School: "assign in career class"
1. School admin applies via `For schools` block (`BR-MKT-008`, `BR-SCHOOL-001`).
2. Create class, invite students (rostering).
3. Assign track; monitor progress; certificates auto-attach to school record (where opted-in).

---

## 6. Content, safety, and compliance

| Area | Requirement |
|------|-------------|
| **Youth safety** | Age-gated; adult teachers cannot DM minors; all Youth Zone content editorially reviewed; COPPA for under-13 excluded from platform; FERPA-compatible for school mode. |
| **Identity** | ID verification before certificate; PII minimized. |
| **Accessibility** | WCAG 2.1 AA across marketing site, app, logged-in web. Video captions required. Text resizable to 200%. Dark-theme site must still meet contrast ratios. |
| **Localization** | v1: English + Spanish. Architecture ready for more without code changes. |
| **Data** | GDPR + CCPA; account deletion purges PII within 30 days; certificate records retained indefinitely by default (user can request deletion). |
| **Credential integrity** | Cryptographically signed, verifiable per Open Badges 3.0; public verification URL. |
| **Volunteer-teacher trust** | "Volunteer" badge on every teacher surface (feed, live, course). Never paid placement. |
| **Anti-addiction pattern** | SkillFeed must include daily-usage reminder and session-end nudge; no infinite-scroll dark pattern. |

---

## 7. Revenue model (authoritative)

**Learners, teachers, teens, schools: free forever.** Revenue comes from employers and institutional partners only.

| Stream | Description |
|--------|-------------|
| Employer subscription | Tiered monthly plans to post jobs and access certified-candidate pool. |
| Placement success fee | Charged to employer when a SkillRise-certified hire clears 30 days. |
| City / government contracts | B2G licensing to municipalities and workforce-development agencies. |
| Corporate training | Companies license internal upskilling using SkillRise tracks. |
| Track co-creation | Employers co-sponsor track development aligned to their hiring needs (branding attribution). |

> Removed from scope vs. predecessor BRD: `$9.99/mo learner premium`. The marketing site explicitly promises **100% free** to learners; the learner AI assistant is free for all.

---

## 8. KPIs

### 8.1 North-star metric
**Monthly Rising Outcomes** = (certificates issued) + (hires confirmed ×3) + (hours-scrolling-replaced ÷ 100).

### 8.2 Targets

| KPI | Target |
|-----|--------|
| Course completion rate | ≥ 70% |
| Certified learners hired within 90 days | ≥ 60% |
| Employer response time to application | < 48 h median |
| Employer time-to-hire | ≤ 11 days avg |
| App store rating | ≥ 4.5 |
| Teen 30-day challenge completion | ≥ 40% of starters |
| Volunteer teacher retention 90d | ≥ 55% publish ≥ 2 lessons |
| Pledge signers growth | ≥ 100 / day |

### 8.3 Leading indicators
DAU, new enrollments, module completion, assessment pass rate, employer postings, application→interview rate, cohort formations, Pledge signings, live-session attendance.

### 8.4 Lagging indicators
Hires confirmed, wage change of placed learners, employer re-hire rate, NPS (learner / teacher / employer), hours of scrolling replaced, Youth Zone graduation rate.

---

## 9. Operational SLAs

| Workflow | SLA |
|----------|-----|
| Editorial review of teacher-recorded lesson | ≤ 48 h business time |
| Employer verification | ≤ 24 h business time |
| Certificate issuance after pass + ID | ≤ 30 s |
| Re-placement flow open after failed hire | initiated ≤ 5 business days |
| Abuse / safety report on feed or live | ≤ 4 h triage |

---

## 10. Risks & mitigations

| Risk | Level | Mitigation |
|------|-------|------------|
| Low completion rates | High | Cohorts, streaks, reminders, 90-day interview guarantee. |
| Employers don’t trust the cert | High | Co-design tracks with them; 90-day hire guarantee; signed credentials; public verification URL. |
| Cold-start (no employers → no learners) | Medium | Launch with pre-signed anchor employers per neighborhood; employer free first 6 months. |
| Certificate fraud | Medium | ID verification + cryptographic signing. |
| Teacher content quality variance | Medium | Mandatory editorial review; rating-driven surface. |
| Youth safety incidents | High | Strict age gating, no adult→minor DMs, moderation, guardian consent where required. |
| Funding dependence on employers | Medium | Diversify via B2G contracts + corporate training. |
| Anti-addiction claims vs. growth pressure | Medium | Daily-limit reminder is a **product rule**, not a toggle marketing can disable. |

---

## 11. Phased delivery

| Phase | Duration | Scope |
|-------|----------|-------|
| **P1 — MVP** | Months 1–3 | Marketing site (full, this doc). App v1 learner flow (enroll → module → cert → jobs). 5 tracks. 10 anchor employers. 1 city. |
| **P2 — Community & Teach** | Months 4–6 | Cohorts, teacher record-on-phone, SkillFeed, live sessions, Pledge. 15 tracks, 3 cities. |
| **P3 — Youth Zone** | Months 7–9 | Youth tracks, 30-day challenge, school partnership program pilot with 5 schools. Verification URL. |
| **P4 — Scale** | Months 10–12 | AI assistant, B2G contract, 10 cities, 40 tracks, corporate training private beta. |
| **P5 — Expand** | Year 2+ | National rollout, corporate training GA, international exploration. |

---

## 12. Design traceability matrix (website)

Populate `Component` with the actual CSS class / section anchor in `skillrise-platform-website.html`.

| Screen section (HTML ref) | BR IDs covered | Copy owner | P | Notes |
|---------------------------|----------------|------------|---|-------|
| `nav.nav`, `#mm` | BR-MKT-001, 015 | PM | Must | Sticky; blur bg; mobile ☰ |
| `.hero` | BR-MKT-002, BR-PLAT-001, BR-FEED-001 | PM + Design | Must | Phone mockup mirrors real SkillFeed |
| `.movement` | BR-MKT-003 | PM | Must | Numbers are live when possible |
| `#mission` | BR-MKT-004 | PM | Must | Before/after block copy fixed |
| `.aud-grid` | BR-MKT-005 | PM | Must | 3 CTAs route to 3 flows |
| `#teach` + `.teach-flow` | BR-MKT-006, BR-TEACH-001..004 | PM | Must | 4 steps, one CTA |
| `.sf-preview` | BR-MKT-007, BR-FEED-001..002 | Design | Must | Sample cards use real volunteers’ copy |
| `#youth` | BR-MKT-008, BR-YOUTH-001..004, BR-PLEDGE-002 | PM + Legal | Must | 30-day challenge + schools block |
| `#stories` | BR-MKT-009 | Comms | Must | Real testimonials only |
| `#pledge` | BR-MKT-010, BR-PLEDGE-001 | PM | Must | Signer counter live |
| `.impact-strip` | BR-MKT-011 | Data | Must | Values from analytics |
| `#employers` | BR-MKT-012, BR-EMP-001..006 | Sales | Must | First job free |
| `#download` | BR-MKT-013 | Growth | Must | QR generated per campaign |
| `footer` | BR-MKT-014 | Legal | Must | Privacy/Terms/Cookies |

---

## 13. Conflicts reconciled vs. predecessor BRD (`skillrise-brd.html`)

| Topic | Predecessor BRD | This doc (authoritative) | Reason |
|-------|-----------------|--------------------------|--------|
| Learner monetization | Premium $9.99/mo | **Free forever for learners** | Website explicitly states "Free to learn. Free to certify. Free to teach. 100% free — funded by employers, not ads." |
| Teachers | "Instructor" SME; implicitly paid or contracted | **Volunteer teachers**, unpaid; "legacy is the pay" | Website "Teach for free" throughout. |
| Content surfaces | Modules only | Modules **+ SkillFeed + Live sessions** | Website dedicates hero + preview to SkillFeed; teach flow has "Go live". |
| Youth segment | Not called out | **Youth Zone (13–18) first-class** | Dedicated section, tracks, challenge, school partnerships. |
| Pledge | Not present | **"The Pledge" + 30-day challenge** | Core brand mechanic on site. |
| Schools | Not present | **Schools program** | `For schools` block in site. |
| Anti-addiction framing | Not present | **Product rule**: daily-limit reminder, no infinite scroll | Site leads with "Stop scrolling". |
| Employer guarantee | Implicit | **90-day hire guarantee** | Employer block on site. |

---

## 14. Open questions (blocking sign-off)

1. Jurisdictions for v1 beyond Manchester NH (testimonials hint at it).
2. Specific Open Badges 3.0 issuer identity — SkillRise alone or co-issuer with accredited body?
3. Guardian-consent model per state for Youth Zone.
4. Live-session recording default: auto-published to feed or teacher-opt-in?
5. Whether school-recognized certificates require state-level accreditation partners.
6. Data-residency requirements for government contracts.
7. Volunteer teacher compensation rule for corporate-training surfaces — still zero, or revenue-share?
8. Minimum teacher vetting (background checks for trades; for teen-facing especially).

---

## 15. Approvals

| Role | Name | Date | Sign-off |
|------|------|------|----------|
| Product | | | |
| Design | | | |
| Engineering | | | |
| Legal / Safety | | | |
| Sales (Employers) | | | |
| Youth / Schools | | | |
