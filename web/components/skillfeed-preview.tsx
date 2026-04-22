import { feedCards } from "@/lib/data";

export function SkillFeedPreview() {
  return (
    <div className="bg-s1 border-t border-[rgba(255,255,255,0.07)]">
      <div
        className="mx-wrap"
        style={{ padding: "clamp(56px,7vw,108px) clamp(18px,5vw,72px)" }}
      >
        <div className="text-center mb-2">
          <div className="stag">SkillFeed</div>
          <h2 className="sh">
            Like your For You page —
            <br />
            but every video makes you better.
          </h2>
          <p className="ss mx-auto">
            Short lessons from volunteer community members. No ads. No doomscrolling. A
            daily limit reminds you to actually go practice what you learned.
          </p>
        </div>
        <div
          className="grid gap-4 mt-10"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}
        >
          {feedCards.map((c) => (
            <div
              key={c.title}
              className="bg-ink border border-[rgba(255,255,255,0.07)] transition-all hover:-translate-y-[3px] hover:border-[rgba(31,200,126,0.2)] overflow-hidden"
              style={{ borderRadius: 20 }}
            >
              <div className="flex items-center gap-[9px]" style={{ padding: "13px 14px 10px" }}>
                <div
                  className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style={{ background: c.avatarGradient }}
                >
                  {c.initials}
                </div>
                <div>
                  <div className="text-[13px] font-bold">{c.name}</div>
                  <div className="text-t3 text-[11px]">{c.role}</div>
                </div>
                <div
                  className="ml-auto font-bold flex-shrink-0 text-g"
                  style={{
                    fontSize: 10,
                    padding: "2px 7px",
                    borderRadius: 4,
                    background: "rgba(31,200,126,0.1)",
                  }}
                >
                  Volunteer
                </div>
              </div>
              <div
                className="flex items-center justify-center text-[40px] relative"
                style={{ height: 100, background: c.thumbGradient }}
              >
                {c.emoji}
              </div>
              <div style={{ padding: "11px 14px 14px" }}>
                <h4 className="text-[14px] font-bold mb-1">{c.title}</h4>
                <p className="text-t3 text-[12px] mb-[9px]">{c.description}</p>
                <div className="flex gap-3 text-t3 text-[11px]">
                  <span>♥ {c.likes}</span>
                  <span>💬 {c.comments}</span>
                  <span>{c.duration}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
