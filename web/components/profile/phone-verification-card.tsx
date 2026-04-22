"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  smsEnabled: boolean;
  phoneVerified: boolean;
  phoneMasked?: string;
  phonePendingMasked?: string;
  devHint: boolean;
};

export function PhoneVerificationCard({
  smsEnabled,
  phoneVerified,
  phoneMasked,
  phonePendingMasked,
  devHint,
}: Props) {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (!smsEnabled) {
    return (
      <div className="card p-5 space-y-2">
        <div className="text-[11px] uppercase tracking-wide text-t3">Mobile</div>
        <p className="text-[13px] text-t2">
          SMS verification is not enabled on this server. Set up Twilio (or run in dev mode) to let learners confirm
          their number for trust and future text reminders.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-3">
      <div>
        <div className="text-[11px] uppercase tracking-wide text-t3 mb-1">Mobile number</div>
        <p className="text-[13px] text-t2">
          Add and verify a mobile number for account trust. This is separate from sign-in — we may use it later for
          course nudges and optional SMS (you’ll always control preferences).
        </p>
      </div>
      {phoneVerified && phoneMasked && (
        <p className="text-[13px] text-t1">
          Verified: <span className="font-mono">{phoneMasked}</span>
        </p>
      )}
      {!phoneVerified && phonePendingMasked && (
        <p className="text-[13px] text-amber-400">Code sent to {phonePendingMasked}</p>
      )}
      {devHint && (
        <p className="text-[12px] text-t3">Dev mode: the SMS body is printed to the server console.</p>
      )}
      {!phoneVerified && (
        <>
          <div>
            <label className="label" htmlFor="phone-verify">
              Mobile (include country code)
            </label>
            <input
              id="phone-verify"
              className="input font-mono text-[14px]"
              placeholder="+1 555 123 4567"
              autoComplete="tel-national"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy}
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              setBusy(true);
              setErr("");
              setMsg("");
              const res = await fetch("/api/me/phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "send", phone }),
              });
              const b = (await res.json()) as { error?: string; hint?: string };
              setBusy(false);
              if (!res.ok) {
                setErr(b.error || "Could not send code.");
                return;
              }
              setMsg("Code sent.");
              if (b.hint) setMsg(b.hint);
              router.refresh();
            }}
          >
            {busy ? "Sending…" : "Send verification code"}
          </button>
          <div>
            <label className="label" htmlFor="phone-otp">6-digit code</label>
            <input
              id="phone-otp"
              className="input font-mono tracking-widest"
              maxLength={6}
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <button
            type="button"
            disabled={busy || code.length !== 6}
            className="btn btn-primary btn-sm"
            onClick={async () => {
              setBusy(true);
              setErr("");
              setMsg("");
              const res = await fetch("/api/me/phone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify", code }),
              });
              const b = (await res.json()) as { error?: string };
              setBusy(false);
              if (!res.ok) {
                setErr(b.error || "Invalid code.");
                return;
              }
              setMsg("Number verified.");
              setCode("");
              setPhone("");
              router.refresh();
            }}
          >
            {busy ? "Checking…" : "Verify code"}
          </button>
        </>
      )}
      {phoneVerified && (
        <button
          type="button"
          disabled={busy}
          className="btn btn-ghost btn-sm w-fit"
          onClick={async () => {
            setBusy(true);
            setErr("");
            setMsg("");
            const res = await fetch("/api/me/phone", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "remove" }),
            });
            const b = (await res.json()) as { error?: string };
            setBusy(false);
            if (!res.ok) {
              setErr(b.error || "Could not remove.");
              return;
            }
            setMsg("Phone removed from your account.");
            router.refresh();
          }}
        >
          {busy ? "Removing…" : "Remove number"}
        </button>
      )}
      {err && <div className="pill pill-red text-[13px]">{err}</div>}
      {msg && !err && <div className="pill text-[13px]">{msg}</div>}
    </div>
  );
}
