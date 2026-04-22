export type Stat = { value: string; label: string };

export const movementStats: Stat[] = [
  { value: "3,400+", label: "Volunteer teachers" },
  { value: "48,000+", label: "Lives changed" },
  { value: "100%", label: "Free — forever" },
  { value: "12,000+", label: "Graduates hired" },
  { value: "1.2M hrs", label: "Scrolling replaced" },
];

export const impactStats: { value: string; label: string; color: string }[] = [
  { value: "1.2M hrs", label: "of scrolling replaced with learning", color: "#1fc87e" },
  { value: "3,400+", label: "volunteer teachers giving freely", color: "#f5a623" },
  { value: "2,800+", label: "teenagers graduated Youth Zone", color: "#4a8ef5" },
  { value: "12,000+", label: "community members hired", color: "#1fc87e" },
  { value: "100%", label: "free — funded by employers, not ads", color: "#9b6cf5" },
];

export const missionPoints = [
  {
    icon: "📵",
    title: "Replace scrolling with learning",
    body:
      "The average person spends 7 hours a day on screens — mostly passively. SkillRise gives that time purpose. Every session replaces a session of mindless content with a skill that compounds over time.",
  },
  {
    icon: "🎓",
    title: "Knowledge should flow freely in a community",
    body:
      "Skilled professionals — plumbers, coders, nurses, teachers, chefs — have knowledge that can transform someone's life. We make it easy to share that knowledge in 30 minutes, for free, to people who need it most.",
  },
  {
    icon: "🏘️",
    title: "Every neighborhood can lift itself",
    body:
      "When someone in your community learns a skill, gets certified, and gets hired — that success inspires 3 more people. SkillRise creates virtuous cycles of growth that start locally and spread outward.",
  },
];

export const audiences = [
  {
    variant: "learner" as const,
    icon: "📚",
    title: "Learners",
    subtitle: "Adults seeking jobs, career changes, or personal growth",
    bullets: [
      "Learn practical skills in 3–8 weeks",
      "Earn verified certificates",
      "Match to local jobs instantly",
      "Join a neighborhood cohort",
      "Everything is free to start",
    ],
    cta: "Start learning free →",
    accent: "#1fc87e",
    textAccent: "#06080d",
    gradient: "linear-gradient(135deg,#071a10,#0d2a1c)",
    border: "rgba(31,200,126,0.15)",
  },
  {
    variant: "teacher" as const,
    icon: "🎓",
    title: "Volunteer Teachers",
    subtitle: "Professionals who want to give back to their community",
    bullets: [
      "Record a lesson on your phone",
      "Host live sessions for free",
      "Build full courses with our team",
      "Track your real-world impact",
      "No pay needed — your legacy is enough",
    ],
    cta: "Volunteer to teach →",
    accent: "#f5a623",
    textAccent: "#06080d",
    gradient: "linear-gradient(135deg,#170e00,#2a1a00)",
    border: "rgba(245,166,35,0.15)",
  },
  {
    variant: "youth" as const,
    icon: "★",
    title: "Teens & Students",
    subtitle: "High schoolers aged 13–18 building their future now",
    bullets: [
      "Age-appropriate tracks (13+)",
      "Coding, design, money, speaking",
      "School-recognized certificates",
      "Replace social media time",
      "Build a portfolio for college & jobs",
    ],
    cta: "Explore Youth Zone →",
    accent: "#9b6cf5",
    textAccent: "#ffffff",
    gradient: "linear-gradient(135deg,#0e0a20,#1a1040)",
    border: "rgba(155,108,245,0.15)",
  },
];

export const teachSteps = [
  {
    icon: "📱",
    title: "Record on your phone",
    body:
      "Film yourself doing what you know. Kitchen table, job site, wherever you are. We add captions and publish it.",
    color: "31,200,126",
  },
  {
    icon: "📺",
    title: "Go live in minutes",
    body:
      "Host a live session for your neighborhood. We handle the tech. You just teach. No experience needed.",
    color: "245,166,35",
  },
  {
    icon: "📚",
    title: "Build a full course",
    body:
      "Work with our editorial team to create a structured track. We help with design, structure, and assessment.",
    color: "74,142,245",
  },
  {
    icon: "📊",
    title: "See your impact",
    body:
      "Watch your student count grow. See when someone you taught gets hired. That number is your legacy.",
    color: "155,108,245",
  },
];

export type FeedCard = {
  initials: string;
  name: string;
  role: string;
  title: string;
  description: string;
  emoji: string;
  likes: number | string;
  comments: number | string;
  duration: string;
  avatarGradient: string;
  thumbGradient: string;
  youth?: boolean;
};

export const feedCards: FeedCard[] = [
  {
    initials: "JM",
    name: "John Martinez",
    role: "Master Electrician",
    title: "How to test a circuit breaker safely",
    description:
      "Step-by-step for beginners. Everything you need before touching a panel.",
    emoji: "⚡",
    likes: 847,
    comments: 34,
    duration: "3 min",
    avatarGradient: "linear-gradient(135deg,#0e7a4e,#1fc87e)",
    thumbGradient: "linear-gradient(135deg,#0a2a1a,#0d3d25)",
  },
  {
    initials: "ML",
    name: "Maya Lawson",
    role: "Financial Coach",
    title: "Build your first real budget — for $15-25/hr earners",
    description:
      "Not theory. A real budget that actually works for people who are starting out.",
    emoji: "💰",
    likes: "2,104",
    comments: 91,
    duration: "5 min",
    avatarGradient: "linear-gradient(135deg,#b45309,#f59e0b)",
    thumbGradient: "linear-gradient(135deg,#1a1000,#2d1e00)",
  },
  {
    initials: "SC",
    name: "Sarah Chen",
    role: "Web Developer · Teens",
    title: "Build a website in 10 minutes — no experience needed",
    description:
      "Perfect for high schoolers. Have something real to show colleges and employers.",
    emoji: "💻",
    likes: "1,340",
    comments: 56,
    duration: "★ Youth",
    avatarGradient: "linear-gradient(135deg,#6d28d9,#9b6cf5)",
    thumbGradient: "linear-gradient(135deg,#0d0a2a,#1a1060)",
    youth: true,
  },
];

export const youthTracks = [
  {
    icon: "💻",
    title: "Coding, design & tech skills",
    sub: "Age 13+ · Beginner-friendly · All free",
    color: "155,108,245",
  },
  {
    icon: "💰",
    title: "Money, budgeting & business basics",
    sub: "Age 15+ · Life skills that school doesn't teach",
    color: "245,166,35",
  },
  {
    icon: "🔌",
    title: "Trade skills that pay from day one",
    sub: "Age 16+ · Electrical, plumbing, HVAC basics",
    color: "31,200,126",
  },
  {
    icon: "🗣️",
    title: "Communication & public speaking",
    sub: "Age 13+ · For school, interviews, life",
    color: "74,142,245",
  },
];

export type Testimonial = {
  quote: string;
  initials: string;
  name: string;
  role: string;
  wage?: string;
  tag?: { label: string; color: "amber" | "purple" };
  avatarGradient: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "I was working retail at $14/hr and scrolling for 3 hours a night. Six weeks after completing Electrical Basics on SkillRise, I had three job offers. I started at Apex Electric at $27/hr. I deleted Instagram the day I enrolled and never went back.",
    initials: "TW",
    name: "Tanya Williams",
    role: "Apprentice Electrician, Manchester NH",
    wage: "$14/hr → $27/hr",
    avatarGradient: "linear-gradient(135deg,#0e7a4e,#1fc87e)",
  },
  {
    quote:
      "I teach electrical safety on SkillRise — 30-minute videos, completely free. I've had 847 students. One of them is now a licensed electrician. That's what I'll tell my kids I did with my life. Not what I posted.",
    initials: "JM",
    name: "John Martinez",
    role: "Master Electrician · Volunteer Teacher",
    tag: { label: "Volunteer Teacher", color: "amber" },
    avatarGradient: "linear-gradient(135deg,#0e7a4e,#1fc87e)",
  },
  {
    quote:
      "I'm 16. I used SkillRise's coding track during summer vacation instead of TikTok. I just landed my first freelance client — a local restaurant wanted a website. I made $400. My mom cried. I cried. Then I enrolled in the next track.",
    initials: "SP",
    name: "Sofia P., age 16",
    role: "High School Student, Manchester NH",
    tag: { label: "★ Youth Zone Graduate", color: "purple" },
    avatarGradient: "linear-gradient(135deg,#6d28d9,#9b6cf5)",
  },
  {
    quote:
      "As a single dad I couldn't do a 2-year program. I studied SkillRise on my phone at night. The Caregiver track was 4 weeks. I got hired before I finished the last module. That's what this platform is — real results, real fast.",
    initials: "RJ",
    name: "Rico James",
    role: "Senior Caregiver, City Medical",
    wage: "Unemployed → $22/hr",
    avatarGradient: "linear-gradient(135deg,#1d4ed8,#4a8ef5)",
  },
  {
    quote:
      "I graduated from SkillRise's web dev track, got hired, and now I teach on SkillFeed. The cycle is beautiful. Someone teaches you, you teach someone else. That's what a real community looks like.",
    initials: "AP",
    name: "Aliya Parker",
    role: "Web Developer & Volunteer Teacher",
    tag: { label: "Graduate turned Volunteer", color: "amber" },
    avatarGradient: "linear-gradient(135deg,#c2410c,#f97316)",
  },
  {
    quote:
      "My school started using SkillRise in career class. Our teacher assigned it instead of homework. Half my class is now working toward a real certificate. Three kids in my year already have job interviews lined up before graduation.",
    initials: "MK",
    name: "Marcus K., age 17",
    role: "High School Junior, Manchester NH",
    tag: { label: "★ Youth Zone Graduate", color: "purple" },
    avatarGradient: "linear-gradient(135deg,#c2410c,#f97316)",
  },
];

export const pledgeCommitments = [
  { id: "c1", text: "Spend 30 fewer minutes on social media every day", default: true },
  { id: "c2", text: "Open SkillRise before opening Instagram or TikTok", default: true },
  { id: "c3", text: "Complete one module before bed each weekday", default: true },
  { id: "c4", text: "Earn my first certificate within 60 days", default: false },
  { id: "c5", text: "Share at least one lesson with someone who needs it", default: false },
];

export const footerLinks = {
  platform: [
    { label: "Skill Tracks", href: "#" },
    { label: "SkillFeed", href: "#" },
    { label: "Youth Zone", href: "#youth" },
    { label: "Certificates", href: "#" },
    { label: "Jobs Board", href: "#employers" },
    { label: "AI Tutor", href: "#" },
  ],
  community: [
    { label: "Teach for free", href: "#teach" },
    { label: "Volunteer teachers", href: "#teach" },
    { label: "For schools", href: "#youth" },
    { label: "For employers", href: "#employers" },
    { label: "The Pledge", href: "#pledge" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Our mission", href: "/#mission" },
    { label: "Verify a certificate", href: "/verify" },
    { label: "For employers", href: "/#employers" },
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
};

export const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Mission", href: "/#mission" },
  { label: "For teens", href: "/#youth" },
  { label: "Stories", href: "/#stories" },
  { label: "About", href: "/about" },
  { label: "Employers", href: "/#employers" },
];
