import type { Role, User } from "./store";
import { store } from "./store";
import type { CommandItem } from "@/components/command-palette";

/**
 * Build the ⌘K command palette dataset for a given user. Each role gets a
 * tailored slice so the palette never shows irrelevant entries (e.g. the
 * employer never sees "Resume your track", the teen never sees jobs).
 */
export function buildCommandItems(user: User): CommandItem[] {
  const items: CommandItem[] = [];

  const navByRole: Record<Role, Array<{ label: string; href: string; emoji?: string; hint?: string }>> = {
    learner: [
      { label: "My Learning", href: "/dashboard", emoji: "▦" },
      { label: "Browse Tracks", href: "/tracks", emoji: "◉" },
      { label: "SkillFeed", href: "/feed", emoji: "◈" },
      { label: "Live sessions", href: "/live", emoji: "●" },
      { label: "AI Tutor", href: "/assistant", emoji: "✦" },
      { label: "Jobs near you", href: "/jobs", emoji: "◆" },
      { label: "My certificates", href: "/cert", emoji: "🏅" },
      { label: "Profile & settings", href: "/profile", emoji: "◯" },
    ],
    teen: [
      { label: "Today's quest", href: "/dashboard", emoji: "⚔" },
      { label: "Learn", href: "/tracks", emoji: "◉" },
      { label: "Feed", href: "/feed", emoji: "◈" },
      { label: "Streak", href: "/challenge", emoji: "🔥" },
      { label: "Profile", href: "/profile", emoji: "★" },
    ],
    teacher: [
      { label: "Instructor dashboard", href: "/teach", emoji: "▤" },
      { label: "My courses", href: "/teach/courses", emoji: "▦" },
      { label: "Students", href: "/teach/students", emoji: "▩" },
      { label: "Inbox", href: "/teach/messages", emoji: "✉" },
      { label: "Quizzes", href: "/teach/quizzes", emoji: "▣" },
      { label: "New recording", href: "/teach/record", emoji: "●", hint: "⌘N" },
      { label: "Go live", href: "/teach/live", emoji: "▶" },
      { label: "Learner home", href: "/dashboard", emoji: "◈" },
      { label: "Account", href: "/profile", emoji: "◆" },
    ],
    employer: [
      { label: "Overview", href: "/dashboard", emoji: "▤" },
      { label: "Applicant pipeline", href: "/employers/dashboard", emoji: "⟶" },
      { label: "All roles", href: "/jobs", emoji: "▦" },
      { label: "Post a role", href: "/employers/post", emoji: "+", hint: "⌘N" },
      { label: "Company profile", href: "/profile", emoji: "◆" },
    ],
    school: [
      { label: "Overview", href: "/dashboard", emoji: "▤" },
      { label: "Classes", href: "/schools/dashboard", emoji: "▩" },
      { label: "Students", href: "/schools/dashboard#students", emoji: "◯" },
      { label: "Certificates", href: "/schools/dashboard#certificates", emoji: "🏅" },
      { label: "Audit log", href: "/schools/dashboard#audit", emoji: "◈" },
      { label: "Skill tracks catalog", href: "/tracks", emoji: "◉" },
      { label: "School profile", href: "/profile", emoji: "◆" },
    ],
    admin: [
      { label: "Dashboard", href: "/dashboard", emoji: "▤" },
      { label: "Moderation", href: "/admin", emoji: "⚠" },
      { label: "Tracks", href: "/tracks", emoji: "◉" },
      { label: "Users", href: "/admin", emoji: "◯" },
    ],
  };

  (navByRole[user.role] ?? []).forEach((n, i) =>
    items.push({
      id: `nav-${i}`,
      kind: "nav",
      label: n.label,
      href: n.href,
      emoji: n.emoji,
      hint: n.hint,
    }),
  );

  const showTracks = user.role === "learner" || user.role === "teen" || user.role === "teacher" || user.role === "admin";
  if (showTracks) {
    for (const t of store.tracks.slice(0, 30)) {
      items.push({
        id: `track-${t.slug}`,
        kind: "track",
        label: t.title,
        href: `/tracks/${t.slug}`,
        subtitle: `${t.level} · ${t.weeks} weeks · ${t.category}`,
        emoji: t.heroEmoji,
      });
    }
  }
  if (user.role === "teacher") {
    for (const t of store.tracks.filter((x) => x.teacherId === user.id)) {
      items.push({
        id: `instructor-${t.slug}`,
        kind: "nav",
        label: `Course: ${t.title}`,
        href: `/teach/course/${t.slug}`,
        emoji: t.heroEmoji,
        subtitle: "Instructor",
      });
    }
  }

  const showJobs = user.role === "learner" || user.role === "employer" || user.role === "admin";
  if (showJobs) {
    for (const j of store.jobs.slice(0, 20)) {
      items.push({
        id: `job-${j.id}`,
        kind: "job",
        label: j.title,
        href: `/jobs/${j.id}`,
        subtitle: `${j.company} · ${j.neighborhood} · $${j.wageFrom}–${j.wageTo}/${j.wageUnit}`,
      });
    }
  }

  const showPeople = user.role === "teacher" || user.role === "school" || user.role === "admin" || user.role === "employer";
  if (showPeople) {
    const pool = store.users.filter((u) => u.id !== user.id).slice(0, 30);
    for (const u of pool) {
      items.push({
        id: `person-${u.id}`,
        kind: "person",
        label: u.name,
        href: "/profile",
        subtitle: `${u.role} · ${u.neighborhood}`,
        emoji: "◯",
      });
    }
  }

  const actions: CommandItem[] = [];
  switch (user.role) {
    case "learner":
      actions.push(
        { id: "act-find", kind: "action", label: "Find a free video", href: "/dashboard", hint: "/", emoji: "⌕" },
        { id: "act-tutor", kind: "action", label: "Ask the AI Tutor", href: "/assistant", emoji: "✦" },
      );
      break;
    case "teen":
      actions.push(
        { id: "act-streak", kind: "action", label: "Check my streak", href: "/challenge", emoji: "🔥" },
      );
      break;
    case "teacher":
      actions.push(
        { id: "act-record", kind: "action", label: "Record a new lesson", href: "/teach/record", emoji: "●" },
        { id: "act-live", kind: "action", label: "Go live now", href: "/teach/live", emoji: "▶" },
      );
      break;
    case "employer":
      actions.push(
        { id: "act-post", kind: "action", label: "Post a new role", href: "/employers/post", emoji: "+" },
      );
      break;
    case "school":
      actions.push(
        { id: "act-export", kind: "action", label: "Export students CSV", href: "/schools/dashboard", emoji: "⇩" },
        { id: "act-add-class", kind: "action", label: "Add class", href: "/schools/dashboard", emoji: "+" },
      );
      break;
  }
  items.push(...actions);

  return items;
}
