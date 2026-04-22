export function Download() {
  return (
    <section
      id="download"
      className="section-pad text-center relative overflow-hidden border-t"
      style={{
        background: "linear-gradient(135deg,#06100a,#0a1e10,#06100a)",
        borderColor: "rgba(31,200,126,0.12)",
      }}
    >
      <div
        aria-hidden
        className="absolute"
        style={{
          top: -80,
          left: "50%",
          transform: "translateX(-50%)",
          width: 500,
          height: 360,
          background: "radial-gradient(ellipse,rgba(31,200,126,0.1),transparent 70%)",
        }}
      />
      <div className="mx-wrap relative z-[1]">
        <div className="stag">Download free</div>
        <h2 className="sh text-white">
          Stop scrolling. Start rising.
          <br />
          Your neighborhood is waiting.
        </h2>
        <p className="ss mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
          Free to download. Free to learn. Free to certify. Free to teach. SkillRise
          only earns when you get hired — so we're 100% on your side.
        </p>

        <div className="flex gap-3 justify-center flex-wrap mt-7">
          <StoreBadge small="Download on the" big="App Store" icon="🍎" href="#" />
          <StoreBadge small="Get it on" big="Google Play" icon="▶" href="#" />
        </div>

        <div
          className="flex items-center justify-center text-[10px] text-gray-800 font-bold mx-auto mt-5"
          style={{
            background: "white",
            borderRadius: 10,
            width: 80,
            height: 80,
          }}
          aria-label="App download QR code"
        >
          📱 QR
        </div>
        <div className="text-[12px] mt-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>
          Scan to download · iOS & Android · Free
        </div>
      </div>
    </section>
  );
}

function StoreBadge({
  small,
  big,
  icon,
  href,
}: {
  small: string;
  big: string;
  icon: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-[10px] cursor-pointer transition-all"
      style={{
        background: "rgba(255,255,255,0.07)",
        border: "1px solid rgba(255,255,255,0.13)",
        borderRadius: 11,
        padding: "11px 20px",
      }}
    >
      <div className="text-[26px]">{icon}</div>
      <div className="text-left">
        <small
          className="block"
          style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginBottom: 1 }}
        >
          {small}
        </small>
        <strong className="block text-[14px] font-bold text-white">{big}</strong>
      </div>
    </a>
  );
}
