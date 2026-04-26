"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { navLinks } from "@/lib/data";
import { ThemeToggle } from "@/components/theme/theme-toggle";

type Me = { user: { id: string; name: string; role: string } | null };

export function Nav() {
  const [open, setOpen] = useState(false);
  const [me, setMe] = useState<Me["user"] | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((body: Me) => {
        if (!cancelled) setMe(body.user);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-[66px] border-b transition-all ${
          scrolled ? "glass border-border1" : "border-transparent"
        }`}
        style={{ padding: "0 clamp(18px,5vw,72px)" }}
      >
        <div>
          <Link href="/" className="font-display text-[21px] font-extrabold text-g">
            Skill<span className="text-t1">Rise</span>
          </Link>
          <div className="text-[11px] text-t3 italic mt-[2px] hidden sm:block">
            Learn. Teach. Rise Together.
          </div>
        </div>
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-[14px] font-medium text-t2 hover:text-t1 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
        <div className="flex gap-[9px] items-center">
          <div className="hidden sm:block">
            <ThemeToggle compact />
          </div>
          {me ? (
            <div className="flex items-center gap-4">
              <Link
                href="/my-courses"
                className="hidden sm:inline-block text-[14px] font-medium text-t2 hover:text-emerald-400 transition-colors"
              >
                My Courses
              </Link>
              <Link href="/dashboard" className="btn btn-primary btn-sm">
                Dashboard
              </Link>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-block text-[13px] font-medium text-t2 hover:text-t1 transition-colors px-3"
              >
                Sign in
              </Link>
              <Link href="/signup" className="btn btn-primary btn-sm">
                Get started free
              </Link>
            </>
          )}
          <button
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="md:hidden bg-transparent border-0 text-t1 text-[22px] cursor-pointer"
          >
            ☰
          </button>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-[200] bg-s1 p-[22px] flex-col ${open ? "flex" : "hidden"}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-7">
          <div className="font-display text-[21px] font-extrabold text-g">
            Skill<span className="text-t1">Rise</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle compact />
            <button
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="bg-transparent border-0 text-t1 text-[22px] cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
        {navLinks.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setOpen(false)}
            className="block font-display text-[21px] font-bold text-t2 hover:text-g py-[13px] border-b border-border1 transition-colors"
          >
            {l.label}
          </a>
        ))}
        <div className="mt-[22px] flex flex-col gap-[10px]">
          {me ? (
            <>
              <Link
                href="/my-courses"
                onClick={() => setOpen(false)}
                className="btn btn-ghost"
                style={{ justifyContent: "center" }}
              >
                My Courses
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="btn btn-primary"
                style={{ justifyContent: "center" }}
              >
                Get started free
              </Link>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="btn btn-ghost"
                style={{ justifyContent: "center" }}
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}
