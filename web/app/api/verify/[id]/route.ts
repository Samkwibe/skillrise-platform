import { NextResponse } from "next/server";
import { store, findUserById, getTrack } from "@/lib/store";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cert = store.certificates.find((c) => c.id === id);
  if (!cert) return NextResponse.json({ error: "Credential not found." }, { status: 404 });
  const owner = findUserById(cert.userId);
  const track = getTrack(cert.trackSlug);
  return NextResponse.json({
    certificate: {
      id: cert.id,
      issuedAt: cert.issuedAt,
      score: cert.score,
      verifiable: cert.verifiable,
      owner: owner ? { name: owner.name, neighborhood: owner.neighborhood } : null,
      track: track ? { slug: track.slug, title: track.title } : null,
    },
  });
}
