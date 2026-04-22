import Link from "next/link";
import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth";
import { listCommunityRoomsFor, findUserById, LIFE_CATEGORIES } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Community · SkillRise" };

/**
 * /community — public list of rooms. Employers and schools don't need
 * this surface; we bounce them to their workspace.
 */
export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const user = await requireVerifiedUser();
  if (user.role === "employer" || user.role === "school") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const filter = sp.cat || "all";
  let rooms = listCommunityRoomsFor(user);
  if (filter !== "all") rooms = rooms.filter((r) => r.category === filter);

  const officeHours = rooms.filter((r) => r.kind === "office-hours");
  const general = rooms.filter((r) => r.kind !== "office-hours");

  const teen = user.role === "teen";
  const cats = [
    { id: "all", label: "All rooms", emoji: "◇" },
    ...LIFE_CATEGORIES.filter((c) => (teen ? c.forTeens : true)).map((c) => ({
      id: c.id,
      label: c.label,
      emoji: c.emoji,
    })),
  ];

  return (
    <div className="py-6 md:py-8">
      <div className="mb-5 md:mb-7">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: "var(--g)" }}>
          Community
        </div>
        <h1
          className="font-extrabold text-[26px] md:text-[32px] leading-tight"
          style={{ fontFamily: "var(--role-font-display)", letterSpacing: "-0.01em" }}
        >
          Ask. Help. Don't do this alone.
        </h1>
        <p className="text-[14.5px] mt-2" style={{ color: "var(--text-2)" }}>
          {teen
            ? "Moderated rooms built for teens. No ads, no strangers, no pressure."
            : "Public rooms by topic and weekly office hours with teachers. Show up as you are."}
        </p>
      </div>

      {/* Category pills. Horizontal-scroll on mobile, wrap on desktop. */}
      <div className="flex flex-nowrap md:flex-wrap gap-2 mb-5 overflow-x-auto no-scrollbar -mx-1 px-1">
        {cats.map((c) => (
          <Link
            key={c.id}
            href={`/community${c.id === "all" ? "" : `?cat=${c.id}`}`}
            className="shrink-0 px-4 py-2 rounded-full text-[13px] font-semibold"
            style={{
              background: filter === c.id ? "var(--g)" : "var(--surface-2)",
              color: filter === c.id ? "var(--bg)" : "var(--text-1)",
              border: `1px solid ${filter === c.id ? "var(--g)" : "var(--border-1)"}`,
            }}
          >
            <span className="mr-1.5">{c.emoji}</span>
            {c.label}
          </Link>
        ))}
      </div>

      {officeHours.length > 0 && (
        <section className="mb-8">
          <div className="flex items-end justify-between mb-3">
            <h2
              className="text-[18px] md:text-[20px] font-extrabold"
              style={{ fontFamily: "var(--role-font-display)" }}
            >
              Office hours with teachers
            </h2>
            <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
              Bring your questions. Leave with answers.
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 3xl:grid-cols-3">
            {officeHours.map((r) => {
              const host = r.hostUserId ? findUserById(r.hostUserId) : null;
              const cat = r.category ? LIFE_CATEGORIES.find((c) => c.id === r.category) : null;
              return (
                <Link
                  key={r.id}
                  href={`/community/${r.slug}`}
                  className="cover-card p-5 group"
                >
                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--g)" }}>
                    ● Office hours {cat ? `· ${cat.label}` : ""}
                  </div>
                  <div
                    className="font-extrabold text-[18px] mt-1 group-hover:underline"
                    style={{ fontFamily: "var(--role-font-display)" }}
                  >
                    {r.name}
                  </div>
                  <div className="text-[13px] mt-1" style={{ color: "var(--text-2)" }}>
                    {r.description}
                  </div>
                  {host && (
                    <div className="mt-3 pt-3 text-[12px] flex items-center gap-2" style={{ borderTop: "1px solid var(--border-1)", color: "var(--text-3)" }}>
                      Hosted by <span className="font-semibold" style={{ color: "var(--text-1)" }}>{host.name}</span>
                      {host.credentials ? ` · ${host.credentials}` : ""}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between mb-3">
          <h2
            className="text-[18px] md:text-[20px] font-extrabold"
            style={{ fontFamily: "var(--role-font-display)" }}
          >
            Rooms
          </h2>
          <div className="text-[12px]" style={{ color: "var(--text-3)" }}>
            Choose any room. Say hi first.
          </div>
        </div>
        {general.length === 0 ? (
          <div className="cover-card p-6 text-center text-[14px]" style={{ color: "var(--text-2)" }}>
            No rooms in this category yet. Try "All rooms".
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 3xl:grid-cols-3">
            {general.map((r) => {
              const cat = r.category ? LIFE_CATEGORIES.find((c) => c.id === r.category) : null;
              return (
                <Link
                  key={r.id}
                  href={`/community/${r.slug}`}
                  className="cover-card p-5 group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--text-3)" }}>
                      {cat ? `${cat.emoji} ${cat.label}` : "General"}
                    </div>
                    {r.kind === "teen-safe" && (
                      <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--text-2)" }}>
                        ★ Teen-safe
                      </span>
                    )}
                  </div>
                  <div
                    className="font-extrabold text-[17px] group-hover:underline"
                    style={{ fontFamily: "var(--role-font-display)" }}
                  >
                    {r.name}
                  </div>
                  <div className="text-[13px] mt-1" style={{ color: "var(--text-2)" }}>
                    {r.description}
                  </div>
                  <div className="text-[11.5px] mt-3 pt-3" style={{ color: "var(--text-3)", borderTop: "1px solid var(--border-1)" }}>
                    {r.memberCount.toLocaleString()} members
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-8 text-[12px] max-w-[720px]" style={{ color: "var(--text-3)" }}>
        {teen
          ? "Every room you see is reviewed. Moderators remove anything unsafe. If something feels wrong, report it — you will always be believed first."
          : "Be kind. This is a place for people who are trying. Report anything that isn't."}
      </p>
    </div>
  );
}
