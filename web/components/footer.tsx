import { footerLinks } from "@/lib/data";
import { about } from "@/lib/about";
import { SocialIcon } from "@/components/about/social-icons";

export function Footer() {
  return (
    <footer
      className="bg-s1 border-t border-border1"
      style={{
        padding:
          "clamp(36px,5vw,60px) clamp(18px,5vw,72px) clamp(20px,3vw,36px)",
      }}
    >
      <div className="mx-wrap">
        <div
          className="grid gap-9 mb-9 footer-grid"
          style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr" }}
        >
          <div>
            <div className="font-display text-[20px] font-extrabold text-g">
              Skill<span className="text-t1">Rise</span>
            </div>
            <div className="text-t3 text-[13px] leading-[1.6] mt-[10px]" style={{ maxWidth: 270 }}>
              Learn a skill, get certified, get hired — or teach what you know for free,
              to help someone rise. For everyone. In every neighborhood.
            </div>
            <div className="text-[12px] text-g italic mt-2">
              "Replace scrolling with rising."
            </div>
            <div className="flex gap-2 mt-4 flex-wrap">
              {about.socials.slice(0, 4).map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 rounded-[10px] border border-border2 flex items-center justify-center text-t2 hover:text-g hover:border-g transition-colors"
                >
                  <SocialIcon name={s.icon} />
                </a>
              ))}
            </div>
          </div>
          <FooterCol title="Platform" links={footerLinks.platform} />
          <FooterCol title="Community" links={footerLinks.community} />
          <FooterCol title="Company" links={footerLinks.company} />
        </div>
        <div
          className="flex justify-between items-center flex-wrap gap-[10px] pt-5 border-t border-border1"
        >
          <div className="text-t3 text-[12px]">
            © {new Date().getFullYear()} SkillRise Inc. — Learn. Teach. Rise Together.
          </div>
          <div className="flex gap-[18px]">
            <a href="/privacy" className="text-t3 text-[12px] hover:text-g transition-colors">
              Privacy
            </a>
            <a href="/terms" className="text-t3 text-[12px] hover:text-g transition-colors">
              Terms
            </a>
            <a href="/cookies" className="text-t3 text-[12px] hover:text-g transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
      <style>{`
        @media(max-width:900px){.footer-grid{grid-template-columns:1fr 1fr !important;}}
        @media(max-width:560px){.footer-grid{grid-template-columns:1fr !important;}}
      `}</style>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4
        className="font-bold text-t3 uppercase mb-[13px]"
        style={{ fontSize: 12, letterSpacing: "0.08em" }}
      >
        {title}
      </h4>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          className="block text-t3 text-[13px] mb-[7px] hover:text-g transition-colors"
        >
          {l.label}
        </a>
      ))}
    </div>
  );
}
