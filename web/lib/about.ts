/**
 * About Me config — single source of truth for the "About Me" section,
 * the /about page, and the footer socials.
 */

export type SocialLink = {
  label: string;
  href: string;
  handle?: string;
  icon?: "github" | "twitter" | "linkedin" | "instagram" | "youtube" | "email" | "globe";
};

export type Project = {
  title: string;
  description: string;
  href: string;
  tag?: string;
};

export type AboutConfig = {
  name: string;
  tagline: string;
  location: string;
  photoUrl: string;
  bio: string[];
  whyBuilt: string;
  highlights: string[];
  socials: SocialLink[];
  projects: Project[];
  email?: string;
  resumeUrl?: string;
};

export const about: AboutConfig = {
  name: "Samuel Raymond Kwibe",
  tagline:
    "Computer Science student at SNHU. Builder of SkillRise. I make software that helps people rise.",
  location: "Southern New Hampshire University",
  photoUrl: "/about-photo.jpg",
  bio: [
    "I'm Samuel Raymond Kwibe, a Computer Science student at Southern New Hampshire University. I've been writing code since I realized it was something I could actually do — and every project I ship starts with the same question: does this help someone?",
    "SkillRise started in a notebook. I kept meeting people in my community who wanted to learn a skill, change careers, or land their first real job, but everything in their way was paywalled, gatekept, or buried under feeds designed to keep them scrolling instead of learning.",
    "So I built what I wished existed. A free platform where anyone can learn a practical skill, get certified, and get hired — and where experienced people can teach for free to help their community rise with them.",
  ],
  whyBuilt:
    "I've seen how much raw talent is locked behind cost and access. Someone in my neighborhood who wants to become an electrician shouldn't need years and thousands of dollars before they can earn. SkillRise is my answer: strip away everything that isn't learning, teaching, or hiring — and make every piece of it free.",
  highlights: [
    "Computer Science student at Southern New Hampshire University (SNHU)",
    "Built SkillRise end-to-end — Next.js, OpenAI streaming tutor, pluggable MongoDB / DynamoDB, AWS",
    "Shipping projects publicly since day one — landing pages, games in C#, small tools on GitHub",
  ],
  socials: [
    { label: "GitHub", href: "https://github.com/Samkwibe", handle: "Samkwibe", icon: "github" },
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/samuel-kwibe-371633249/",
      handle: "samuel-kwibe",
      icon: "linkedin",
    },
    {
      label: "Portfolio",
      href: "https://samuel-kwibe-portfolio.web.app/",
      handle: "samuel-kwibe-portfolio.web.app",
      icon: "globe",
    },
  ],
  projects: [
    {
      title: "SkillRise",
      description:
        "Free platform to learn a practical skill, get certified, and get hired. Next.js 16, OpenAI streaming tutor, pluggable MongoDB / DynamoDB, AWS App Runner + Cognito + S3.",
      href: "/",
      tag: "This product",
    },
    {
      title: "Portfolio",
      description:
        "My personal site — every project I've shipped, the tools I used, and the story behind each one.",
      href: "https://samuel-kwibe-portfolio.web.app/",
      tag: "Live",
    },
    {
      title: "GitHub",
      description:
        "Open-source and class projects — from landing-page labs to small games in C#. Everything I build in public.",
      href: "https://github.com/Samkwibe",
      tag: "Code",
    },
  ],
};
