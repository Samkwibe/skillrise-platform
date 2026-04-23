"use client";

import { useState } from "react";

export function AnnouncementReadForm({ trackSlug, announcementId }: { trackSlug: string; announcementId: string }) {
  const [ok, setOk] = useState(false);
  if (ok) return <span className="text-[11px] text-g mt-2 inline-block">Marked read</span>;
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm mt-2"
      onClick={async () => {
        const res = await fetch(`/api/course/${encodeURIComponent(trackSlug)}/announcements/${encodeURIComponent(announcementId)}/read`, {
          method: "POST",
        });
        if (res.ok) setOk(true);
      }}
    >
      Mark as read
    </button>
  );
}
