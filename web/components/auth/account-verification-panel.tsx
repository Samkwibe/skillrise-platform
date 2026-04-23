"use client";

import { useEffect, useState } from "react";

type EmailDispatch = { delivery: string };

type Options = {
  emailAvailable: boolean;
  smsAvailable: boolean;
  preferred: "email" | "sms";
  /** Present in development when SMS is log-only: public “receive SMS” page for testing OTP. */
  tempSmsInboxUrl?: string;
};

const DEV_VERIFY_SESSION_KEY = "skillrise:devEmailVerificationLink";

/**
 * First-time account verification: user chooses **email (default)** or **SMS** (when the server has SMS).
 * Google sign-in users never see this shell.
 */
export function AccountVerificationPanel() {
  const [options, setOptions] = useState<Options | null>(null);
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [devMail, setDevMail] = useState(false);
  const [devEmailLink, setDevEmailLink] = useState<string | null>(null);
  const [st, setSt] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [msg, setMsg] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [busySms, setBusySms] = useState(false);

  useEffect(() => {
    setMsg(null);
    setSt("idle");
  }, [channel]);

  useEffect(() => {
    void fetch("/api/auth/email-delivery")
      .then((r) => r.json() as Promise<EmailDispatch>)
      .then((d) => {
        if (d.delivery === "console" || d.delivery === "unknown") setDevMail(true);
      })
      .catch(() => {});

    void fetch("/api/auth/verification-options")
      .then((r) => r.json() as Promise<Options & { error?: string }>)
      .then((d) => {
        if (d.error || !d.emailAvailable) return;
        setOptions(d);
        setChannel(d.preferred);
      })
      .catch(() => setOptions({ emailAvailable: true, smsAvailable: false, preferred: "email" }));

    try {
      const fromSignup = sessionStorage.getItem(DEV_VERIFY_SESSION_KEY);
      if (fromSignup) {
        setDevEmailLink(fromSignup);
      }
    } catch {
      // ignore
    }
  }, []);

  async function setPref(next: "email" | "sms") {
    if (next === "sms" && !options?.smsAvailable) return;
    setChannel(next);
    const res = await fetch("/api/auth/verification-preference", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: next }),
    });
    if (res.ok) {
      const data = (await res.json()) as { preferred?: "email" | "sms" };
      setOptions((o) => o && { ...o, preferred: data.preferred ?? next });
    }
  }

  async function resendEmail() {
    setSt("loading");
    setMsg(null);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      const data = (await res.json()) as { error?: string; ok?: boolean; devVerificationLink?: string };
      if (!res.ok) {
        setSt("err");
        setMsg(data.error || "Couldn’t send.");
        return;
      }
      if (typeof data.devVerificationLink === "string" && data.devVerificationLink.length > 0) {
        setDevEmailLink(data.devVerificationLink);
        try {
          sessionStorage.setItem(DEV_VERIFY_SESSION_KEY, data.devVerificationLink);
        } catch {
          // ignore
        }
      }
      setSt("ok");
      setMsg("Check your inbox for a new link.");
    } catch {
      setSt("err");
      setMsg("Network error.");
    }
  }

  async function sendSms() {
    setBusySms(true);
    setMsg(null);
    setSt("idle");
    try {
      const res = await fetch("/api/auth/account-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", phone }),
      });
      const d = (await res.json()) as { error?: string; hint?: string; ok?: boolean };
      if (!res.ok) {
        setSt("err");
        setMsg(d.error || "Could not send SMS.");
        return;
      }
      setSt("ok");
      setMsg(d.hint || "Code sent. Check your phone (or the server log in dev).");
    } catch {
      setSt("err");
      setMsg("Network error.");
    }
    setBusySms(false);
  }

  async function confirmSms() {
    setBusySms(true);
    setMsg(null);
    try {
      const res = await fetch("/api/auth/account-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", code }),
      });
      const d = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSt("err");
        setMsg(d.error || "Invalid code.");
        return;
      }
      window.location.assign("/dashboard");
    } catch {
      setSt("err");
      setMsg("Network error.");
    }
    setBusySms(false);
  }

  return (
    <div
      className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-t1"
      role="status"
    >
      <p className="font-medium text-amber-200/90">Verify your account</p>
      <p className="text-t2 mt-1">
        Choose how to confirm you control this account. Email is the default; SMS is available when your host enables
        it.
      </p>

      {options?.smsAvailable && (
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            type="button"
            onClick={() => void setPref("email")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${
              channel === "email" ? "bg-g text-ink" : "bg-surface-2 text-t2"
            }`}
          >
            Email
          </button>
          <button
            type="button"
            onClick={() => void setPref("sms")}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold ${
              channel === "sms" ? "bg-g text-ink" : "bg-surface-2 text-t2"
            }`}
          >
            SMS
          </button>
        </div>
      )}

      {devEmailLink && (!options || options.emailAvailable) && channel === "email" && (
        <div className="mt-3 rounded-md border border-g/40 bg-ink/40 px-3 py-2 text-[13px] text-t1 space-y-2">
          <p className="text-amber-200/90 font-medium">Local dev: email link</p>
          <p className="text-t2 text-[12px] leading-relaxed break-all">
            <a href={devEmailLink} className="text-g underline">
              Open verification link
            </a>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                void navigator.clipboard.writeText(devEmailLink);
              }}
            >
              Copy link
            </button>
            <button
              type="button"
              className="text-[12px] text-t2 underline"
              onClick={() => {
                setDevEmailLink(null);
                try {
                  sessionStorage.removeItem(DEV_VERIFY_SESSION_KEY);
                } catch {
                  // ignore
                }
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {(!options || options.emailAvailable) && channel === "email" && (
        <div className="mt-3 space-y-2">
          <p className="text-t2 text-[13px]">
            We sent a link when you signed up. You can resend a fresh email below.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resendEmail}
              disabled={st === "loading" || st === "ok"}
              className="text-sm font-semibold text-g underline disabled:opacity-50"
            >
              {st === "loading" ? "Sending…" : "Resend email"}
            </button>
            {msg && channel === "email" && (
              <span className={st === "err" ? "text-red-400" : "text-t2"}>{msg}</span>
            )}
          </div>
        </div>
      )}

      {options?.smsAvailable && channel === "sms" && (
        <div className="mt-3 space-y-3 text-[13px]">
          <p className="text-t2">Enter a mobile number you can receive a code on. This also saves the number to your profile as verified.</p>
          {options.tempSmsInboxUrl && (
            <p className="text-t2 text-[12px] leading-relaxed">
              <strong className="text-amber-200/90">Dev / testing only:</strong> you can use a public temporary number
              and read the code on the service’s page (e.g.{" "}
              <a
                href={options.tempSmsInboxUrl}
                target="_blank"
                rel="noreferrer"
                className="text-g underline"
              >
                {options.tempSmsInboxUrl.replace(/^https?:\/\//, "")}
              </a>
              ). Do not use for production or sensitive accounts.
            </p>
          )}
          <div>
            <label className="label" htmlFor="acct-sms-phone">Mobile (include country code)</label>
            <input
              id="acct-sms-phone"
              className="input font-mono"
              placeholder="+1 555 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busySms}
            onClick={sendSms}
            className="btn btn-secondary btn-sm"
          >
            {busySms ? "Sending…" : "Send code"}
          </button>
          <div>
            <label className="label" htmlFor="acct-sms-code">6-digit code</label>
            <input
              id="acct-sms-code"
              className="input font-mono tracking-widest"
              maxLength={6}
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </div>
          <button
            type="button"
            disabled={busySms || code.length !== 6}
            onClick={confirmSms}
            className="btn btn-primary btn-sm"
          >
            {busySms ? "Checking…" : "Verify & continue"}
          </button>
          {msg && channel === "sms" && (
            <p className={st === "err" ? "text-red-400" : "text-t2"}>{msg}</p>
          )}
        </div>
      )}

      {devMail && (
        <p className="text-amber-200/80 text-[13px] mt-3 border-t border-amber-500/20 pt-2">
          <strong className="text-amber-100">Server note:</strong> This host is not using Amazon SES inboxes
          (AUTH_EMAIL_MODE is not <code className="font-mono text-[12px]">ses</code>). In local development the app
          shows the link above; you can also inspect the API response in the browser network tab, or choose SMS if
          enabled.
        </p>
      )}
    </div>
  );
}
