import Image from "next/image";

export function Avatar({
  spec,
  photoUrl,
  name = "",
  size = 40,
}: {
  spec: string;
  photoUrl?: string | null;
  name?: string;
  size?: number;
}) {
  const [initials = "SR", grad = "0e7a4e:1fc87e"] = spec.split("|");
  const [a, b] = grad.split(":");

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={name ? `${name} profile photo` : ""}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        unoptimized={photoUrl.includes("googleusercontent")}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg,#${a},#${b})`,
      }}
      className="rounded-full flex items-center justify-center font-extrabold text-white select-none shrink-0"
    >
      {initials}
    </div>
  );
}
