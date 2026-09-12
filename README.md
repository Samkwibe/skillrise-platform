# 🚀 SkillRise

### Full-Stack Learning, Career & Community Platform

SkillRise is a full-stack learning and career platform designed to help users **build skills, discover career opportunities, participate in live learning cohorts, and connect with a community of learners and professionals**.

The platform combines personalized learning experiences, job discovery, cohort-based education, community features, and AI-assisted functionality into a unified web application.

Built with **Next.js, React, and TypeScript**, SkillRise is structured as a production-oriented web application with deployment support for **AWS App Runner**.

---

## ✨ Features

### 🎓 Personalized Learning

- Personalized learning experiences based on user goals and interests
- Skill development workflows designed around career progression
- Learning resources and structured educational experiences
- User-focused progress and skill-building experiences

### 💼 Career & Job Discovery

- Job discovery functionality for users exploring career opportunities
- Career-oriented learning experiences
- Connects skill development with real-world employment opportunities
- Helps users identify opportunities aligned with their skills and interests

### 👥 Live Cohorts

- Cohort-based learning experiences
- Supports structured learning with groups of participants
- Designed for collaborative and community-driven education
- Provides a foundation for live educational programs and workshops

### 🤝 Community

- Community-driven skill development
- User interaction and collaborative learning experiences
- Designed to connect learners with peers and professional opportunities

### 🤖 AI-Assisted Features

- AI-assisted functionality integrated into the learning experience
- Designed to provide more personalized and intelligent user interactions
- Supports users throughout their learning and career-development journey

---

## 🏗️ Application Architecture

```text
                    ┌─────────────────────────┐
                    │      SkillRise Web      │
                    │                         │
                    │     Next.js + React     │
                    │      TypeScript         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    Application Logic    │
                    │                         │
                    │ Learning                │
                    │ Career / Jobs           │
                    │ Cohorts                 │
                    │ Community               │
                    │ AI-Assisted Features   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │    External Services    │
                    │                         │
                    │ APIs / AI Services      │
                    │ Career Data             │
                    │ Platform Integrations    │
                    └─────────────────────────┘
````

---

## 🛠️ Technology Stack

| Category          | Technologies               |
| ----------------- | -------------------------- |
| Framework         | Next.js                    |
| Frontend          | React                      |
| Language          | TypeScript                 |
| Runtime / Tooling | Node.js, npm               |
| Cloud Deployment  | AWS App Runner             |
| Architecture      | Full-Stack Web Application |
| Configuration     | Environment Variables      |

---

## 📂 Project Structure

```text
skillrise-platform/
│
├── web/
│   ├── app/                 # Next.js application
│   ├── components/          # Reusable UI components
│   ├── public/              # Static assets
│   ├── ...
│   │
│   ├── .env.example         # Environment configuration template
│   ├── apprunner.yaml       # AWS App Runner configuration
│   └── DEPLOYMENT.md        # Deployment documentation
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/Samkwibe/skillrise-platform.git
cd skillrise-platform
```

### 2. Navigate to the web application

```bash
cd web
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Configure the required environment variables in `.env.local`.

> **Never commit secrets or production credentials to the repository.**

### 5. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## ☁️ AWS Deployment

SkillRise is configured for deployment using **AWS App Runner**.

The application uses the `web` directory as the source directory for the Next.js application.

### AWS App Runner Configuration

```text
Repository
    │
    ▼
skillrise-platform/
    │
    └── web/
         │
         ├── Next.js Application
         ├── package.json
         └── apprunner.yaml
                  │
                  ▼
             AWS App Runner
                  │
                  ▼
             Production App
```

For Git-based AWS App Runner deployment:

1. Connect the GitHub repository to AWS App Runner.
2. Set the source directory to:

```text
web
```

3. Configure App Runner to use the repository's:

```text
apprunner.yaml
```

4. Configure the required production environment variables.
5. Deploy the application.

See [`web/DEPLOYMENT.md`](web/DEPLOYMENT.md) for detailed deployment instructions.

---

## 🔐 Environment Configuration

SkillRise uses environment variables for configuration and external service integrations.

Example:

```env
# Example configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add project-specific variables here
# API_KEY=your_api_key
# DATABASE_URL=your_database_url
```

The exact variables required by the application should be configured using:

```text
web/.env.example
```

Never commit `.env.local` or production secrets to GitHub.

---

## 🧩 Core Platform Areas

SkillRise is organized around several major product areas:

```text
SkillRise
│
├── 🎓 Learning
│   └── Personalized Skill Development
│
├── 💼 Career
│   └── Job & Opportunity Discovery
│
├── 👥 Cohorts
│   └── Live & Collaborative Learning
│
├── 🤝 Community
│   └── Peer-Based Skill Building
│
└── 🤖 AI
    └── AI-Assisted Experiences
```

---

## 🎯 Engineering Focus

SkillRise demonstrates experience building a modern full-stack web platform with an emphasis on:

* Full-stack application development
* Next.js development
* React component architecture
* TypeScript development
* Responsive web application design
* Environment-based configuration
* Production deployment
* AWS cloud deployment
* Monorepo application structure
* AI-assisted application features
* Career and education technology

---

## 🔮 Future Improvements

Potential areas for continued development include:

* Expanded AI-powered learning recommendations
* Personalized career roadmaps
* Advanced skill assessments
* Real-time cohort collaboration
* Messaging and notifications
* More advanced community functionality
* Learning progress analytics
* Additional career and job integrations
* Expanded cloud infrastructure and observability

---

## 👨‍💻 Author

### Samuel Raymond Kwibe

Computer Science | Software Engineering | AI | Cloud Engineering

**GitHub:** [@Samkwibe](https://github.com/Samkwibe)

**LinkedIn:** [Samuel Kwibe](https://www.linkedin.com/in/samuel-kwibe-371633249/)

---
