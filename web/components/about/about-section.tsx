import { about } from "@/lib/about";
import { SocialIcon } from "./social-icons";
import { AboutAvatar } from "./about-avatar";

function hasPlaceholder(str?: string) {
  return !!str && str.includes("{{");
}

export function AboutSection({ variant = "full" }: { variant?: "full" | "compact" }) {
  const initials = about.name
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join("")
    .replace(/[^A-Z]/g, "") || "SR";
  const placeholder = hasPlaceholder(about.name);

  return (
    <section id="about" className="section-pad">
      <div className="mx-wrap grid md:grid-cols-[280px_1fr] gap-8 lg:gap-14 items-start">
        <div className="reveal">
          <AboutAvatar src={about.photoUrl} alt={about.name} initials={initials} />
          <div className="flex flex-wrap gap-2">
            {about.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-[7px] rounded-[10px] border border-border2 text-[12px] text-t2 hover:text-t1 hover:border-g transition-colors"
              >
                <SocialIcon name={s.icon} />
                <span>{s.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="reveal">
          <div className="stag">About me</div>
          <h2 className="sh">
            {placeholder ? (
              <>
                Hi, I'm <span className="gradient-text">{about.name}</span>
              </>
            ) : (
              <>
                Hi, I'm <span className="gradient-text">{about.name}</span>.
              </>
            )}
          </h2>
          <p className="ss mb-2">{about.tagline}</p>
          <p className="text-[13px] text-t3 mb-6">{about.location}</p>

          <div className="space-y-3 mb-8">
            {about.bio.map((p, i) => (
              <p key={i} className="text-[15px] text-t2 leading-relaxed">{p}</p>
            ))}
          </div>

          <div className="card p-5 mb-8">
            <div className="text-[12px] font-bold uppercase tracking-wider text-g mb-2">
              Why I built SkillRise
            </div>
            <p className="text-[15px] text-t1 leading-relaxed">{about.whyBuilt}</p>
          </div>

          {variant === "full" && (
            <>
              <h3 className="text-[18px] font-bold mb-3 text-t1">Highlights</h3>
              <ul className="grid sm:grid-cols-3 gap-3 mb-8">
                {about.highlights.map((h) => (
                  <li key={h} className="card card-hover p-4 text-[14px] text-t2">
                    {h}
                  </li>
                ))}
              </ul>

              <h3 className="text-[18px] font-bold mb-3 text-t1">Projects</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {about.projects.map((p) => (
                  <a
                    key={p.title}
                    href={p.href}
                    target={p.href.startsWith("/") ? "_self" : "_blank"}
                    rel="noopener noreferrer"
                    className="card card-hover p-4 block group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[15px] font-bold text-t1 group-hover:text-g transition-colors">
                        {p.title}
                      </span>
                      {p.tag && <span className="pill pill-g">{p.tag}</span>}
                    </div>
                    <p className="text-[13px] text-t2 leading-relaxed">{p.description}</p>
                  </a>
                ))}
              </div>
            </>
          )}

          {placeholder && (
            <p className="mt-6 text-[12px] text-amber">
              Placeholders detected — edit <span className="kbd">lib/about.ts</span> with your real info.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
