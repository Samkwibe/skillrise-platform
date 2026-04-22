export function Avatar({ spec, size = 40 }: { spec: string; size?: number }) {
  // spec format: "IN|hexA:hexB"
  const [initials = "SR", grad = "0e7a4e:1fc87e"] = spec.split("|");
  const [a, b] = grad.split(":");
  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg,#${a},#${b})`,
      }}
      className="rounded-full flex items-center justify-center font-extrabold text-white select-none"
    >
      {initials}
    </div>
  );
}
