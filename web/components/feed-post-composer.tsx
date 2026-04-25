"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LIFE_CATEGORIES, type LifeCategory, type Role } from "@/lib/store";

const EMOJIS = ["⚡", "💻", "💰", "🔧", "🎓", "🗣️", "💼", "🧠", "🏠", "🛡️", "🚀", "🩺"];

type Props = {
  role: Role;
  trackChoices?: { slug: string; title: string }[];
  /** e.g. teacher record page: title */
  formTitle?: string;
};

/**
 * Publishes a real text + optional video post to SkillFeed (learners, teens, teachers, admins).
 */
export function FeedPostComposer({ role, trackChoices = [], formTitle = "Share something you learned" }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [takeaway, setTakeaway] = useState("");
  const [category, setCategory] = useState<LifeCategory>("job-readiness");
  const [duration, setDuration] = useState("1 min");
  const [emoji, setEmoji] = useState("🎓");
  const [youth, setYouth] = useState(false);
  const [trackSlug, setTrackSlug] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const teen = role === "teen";
  const visibleCats = LIFE_CATEGORIES.filter((c) => (teen ? c.forTeens : true));

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        const res = await fetch("/api/feed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
            takeaway: takeaway.trim() || undefined,
            duration,
            emoji,
            youth: teen || youth,
            trackSlug: trackSlug || undefined,
            videoUrl: videoUrl.trim() || undefined,
          }),
        });
        setBusy(false);
        if (!res.ok) {
          const b = (await res.json().catch(() => ({}))) as { error?: string };
          setErr(b.error || "Could not publish.");
          return;
        }
        setTitle("");
        setDescription("");
        setTakeaway("");
        setVideoUrl("");
        router.push("/feed");
        router.refresh();
      }}
      className="card p-5 md:p-6 mb-6"
      style={{ border: "1px solid var(--border-1)" }}
    >
      <div className="font-display text-lg font-extrabold mb-1">{formTitle}</div>
      <p className="text-[13px] text-t3 mb-4">
        Educational only — a tip, a win, or a short clip. Everyone sees your name and your words.
        {teen && " Posts are shown in the Youth Zone."}
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <label className="label" htmlFor="fp-title">
            Headline
          </label>
          <input
            id="fp-title"
            className="input"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How I passed my first phone screen"
          />
        </div>
        <div>
          <label className="label" htmlFor="fp-body">
            What happened / what to try
          </label>
          <textarea
            id="fp-body"
            className="input"
            rows={4}
            required
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write like you're helping a friend. No ads, no spam."
          />
        </div>
        <div>
          <label className="label" htmlFor="fp-takeaway">
            One-line takeaway (optional)
          </label>
          <input
            id="fp-takeaway"
            className="input"
            maxLength={500}
            value={takeaway}
            onChange={(e) => setTakeaway(e.target.value)}
            placeholder="The single thing readers should remember"
          />
        </div>
        <div>
          <label className="label" htmlFor="fp-cat">
            Category
          </label>
          <select
            id="fp-cat"
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value as LifeCategory)}
          >
            {visibleCats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="fp-video">
            Video (optional)
          </label>
          <input
            id="fp-video"
            className="input"
            type="url"
            inputMode="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=… or a direct .mp4 link"
          />
          <p className="text-[11px] text-t3 mt-1">YouTube, Vimeo, or a public https://…mp4 link. Reels will play it full screen.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="fp-dur">
              Watch time
            </label>
            <input
              id="fp-dur"
              className="input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="fp-emoji">
              Cover
            </label>
            <select id="fp-emoji" className="input" value={emoji} onChange={(e) => setEmoji(e.target.value)}>
              {EMOJIS.map((x) => (
                <option key={x} value={x}>
                  {x}
                </option>
              ))}
            </select>
          </div>
          {trackChoices.length > 0 ? (
            <div>
              <label className="label" htmlFor="fp-track">
                Related course (optional)
              </label>
              <select
                id="fp-track"
                className="input"
                value={trackSlug}
                onChange={(e) => setTrackSlug(e.target.value)}
              >
                <option value="">None</option>
                {trackChoices.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
        {!teen && (
          <label className="flex items-center gap-2 text-[13px] text-t2 cursor-pointer">
            <input type="checkbox" checked={youth} onChange={(e) => setYouth(e.target.checked)} />
            Also show in Youth Zone (13–18)
          </label>
        )}
        {err && (
          <div className="rounded-lg border border-rose-500/50 bg-rose-500/10 px-3 py-2 text-[13px] text-rose-200">
            {err}
          </div>
        )}
        <button disabled={busy} className="btn btn-primary btn-xl justify-center" type="submit">
          {busy ? "Publishing…" : "Post to SkillFeed"}
        </button>
      </div>
    </form>
  );
}
