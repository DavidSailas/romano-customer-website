"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, X, Search, ShoppingBag, User as UserIcon, LogOut, Loader2, CheckCircle2, ArrowRight, Truck, CreditCard, BadgeCheck } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";
import { COLLECTIONS } from "@/lib/collections";

/* ------------------------------------------------------------------ */
/*  House of Romano — landing page                                     */
/*  A small, Cebu-based online shop selling multi-brand clothing:      */
/*  jeans, shorts, jackets, caps, and everyday wear.                   */
/*  Visual language: travertine stone, deep green, aged brass, and a   */
/*  light "pattern room" motif used purely as decoration.              */
/* ------------------------------------------------------------------ */

const LOOKS = [
  { n: "01", name: "The Straight Jean", swatch: ["#22301F", "#3C4A38"], image: "/looks/straight-jean.jpg" },
  { n: "02", name: "The Cargo Short", swatch: ["#8A3B2A", "#A9573F"], image: "/looks/cargo-short.jpg" },
  { n: "03", name: "The Denim Jacket", swatch: ["#2B3A2A", "#1C2620"], image: "/looks/denim-jacket.jpg" },
  { n: "04", name: "The Snapback Cap", swatch: ["#C7A467", "#A9813F"], image: "/looks/snapback-cap.jpg" },
  { n: "05", name: "The Everyday Tee", swatch: ["#4A463E", "#6B6558"], image: "/looks/everyday-tee.jpg" },
];

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function PatternArt({ className = "" }) {
  return (
    <svg
      viewBox="0 0 600 620"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {/* bodice-style panel curve */}
      <path
        d="M120 60 C 60 160, 70 320, 140 560"
        stroke="var(--brass)"
        strokeWidth="1.4"
        opacity="0.55"
      />
      <path
        d="M480 40 C 560 170, 540 340, 460 580"
        stroke="var(--brass)"
        strokeWidth="1.4"
        opacity="0.55"
      />
      {/* dart lines */}
      <path
        d="M300 220 L 260 320 L 340 320 Z"
        stroke="var(--verde)"
        strokeWidth="1.2"
        opacity="0.5"
      />
      {/* notches */}
      {[140, 220, 300, 380, 460].map((y, i) => (
        <line
          key={i}
          x1="118"
          y1={y}
          x2="132"
          y2={y + 8}
          stroke="var(--brass)"
          strokeWidth="1.4"
          opacity="0.6"
        />
      ))}
      {/* grainline arrow */}
      <line
        x1="300"
        y1="90"
        x2="300"
        y2="540"
        stroke="var(--ink)"
        strokeWidth="1"
        strokeDasharray="2 6"
        opacity="0.35"
      />
      <path d="M294 96 L300 84 L306 96" stroke="var(--ink)" strokeWidth="1" opacity="0.35" />
      <path d="M294 534 L300 546 L306 534" stroke="var(--ink)" strokeWidth="1" opacity="0.35" />
      {/* button row */}
      {[180, 240, 300, 360, 420].map((y, i) => (
        <circle key={i} cx="300" cy={y} r="3.5" stroke="var(--verde)" strokeWidth="1" opacity="0.45" />
      ))}
    </svg>
  );
}

function HeroImage({ className = "" }) {
  return (
    <div className={className}>
      <img
        src="/bg.png"
        alt="Fashion illustration of a model wearing an oversized sweater and trousers"
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export default function Home() {
  const [navOpen, setNavOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const { user } = useUser();
  const router = useRouter();

  // ---- Search overlay ----
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const categories = q
      ? COLLECTIONS.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.ital.toLowerCase().includes(q) ||
            c.copy.toLowerCase().includes(q)
        )
      : COLLECTIONS;
    const looks = q ? LOOKS.filter((l) => l.name.toLowerCase().includes(q)) : [];
    return { categories, looks };
  }, [searchQuery]);

  function openSearch() {
    setSearchOpen(true);
    setNavOpen(false);
  }

  function closeSearch() {
    setSearchOpen(false);
    setSearchQuery("");
  }

  // Sends the person to the dashboard's Shop tab with that category
  // pre-selected, instead of the old (now retired) /categories/[slug] page.
  function goToCategory(slug: string) {
    closeSearch();
    const match = COLLECTIONS.find((c) => c.slug === slug);
    router.push(`/dashboard?category=${encodeURIComponent(match?.title ?? "")}`);
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (searchResults.categories.length > 0) {
      goToCategory(searchResults.categories[0].slug);
    }
  }

  // Focus the input as soon as the overlay opens
  useEffect(() => {
    if (searchOpen) {
      const id = setTimeout(() => searchInputRef.current?.focus(), 10);
      return () => clearTimeout(id);
    }
  }, [searchOpen]);

  // Cmd/Ctrl+K opens search from anywhere; Escape closes it
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Lock page scroll while the search overlay is open
  useEffect(() => {
    if (searchOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [searchOpen]);

  // ---- Newsletter form ----
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterError, setNewsletterError] = useState("");

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      setNewsletterStatus("error");
      setNewsletterError("Enter your email to sign up.");
      return;
    }
    if (!isValidEmail(newsletterEmail)) {
      setNewsletterStatus("error");
      setNewsletterError("That email doesn't look right — check and try again.");
      return;
    }

    setNewsletterStatus("loading");
    setNewsletterError("");

    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert([{ email: newsletterEmail.trim().toLowerCase() }]);

    if (error) {
      // Postgres unique-violation code — treat "already subscribed" as a success state
      if (error.code === "23505") {
        setNewsletterStatus("success");
      } else {
        setNewsletterStatus("error");
        setNewsletterError("Something went wrong. Please try again.");
      }
      return;
    }

    setNewsletterStatus("success");
    setNewsletterEmail("");
  }

  // Auto-hiding scrollbar: show the thumb while the user is actively
  // scrolling, then hide it again after a brief idle period.
  React.useEffect(() => {
    const root = document.documentElement;
    let hideTimer: ReturnType<typeof setTimeout>;

    function handleScroll() {
      root.classList.add("is-scrolling");
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => root.classList.remove("is-scrolling"), 1000);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(hideTimer);
    };
  }, []);

  function openAuth(mode: "signin" | "signup") {
    setAuthMode(mode);
    setAuthOpen(true);
    setNavOpen(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setNavOpen(false);
  }

  const displayName =
    (user?.user_metadata as { full_name?: string } | undefined)?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "";

  return (
    <div className="romano-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&display=swap');

        .romano-root {
          --stone: #EDE6D8;
          --stone-light: #F6F1E7;
          --ink: #1C1815;
          --verde: #2B3A2A;
          --verde-dark: #17211A;
          --brass: #A9813F;
          --brass-light: #C7A467;
          --oxide: #8A3B2A;
          background: var(--stone);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
          position: relative;
        }
        /* Only body gets the explicit overflow-x rule. html's own overflow
           must stay at its default 'visible' — that's what lets body's
           overflow propagate up to become the real browser viewport's
           scroll behavior. If html also got a non-visible overflow here,
           and layout.tsx also gives html an explicit height (h-full),
           html turns into its own separate, viewport-clamped scroll box
           that traps anything sticky inside it. */
        body {
          overflow-x: hidden;
        }
        html {
          scrollbar-gutter: stable;
          scroll-behavior: smooth;
          scroll-padding-top: 88px; /* keeps section titles clear of the sticky header */
        }
        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }
        }
        /* Professional auto-hiding page scrollbar.
           The track keeps its width at all times (no layout shift), but the
           thumb is invisible until the page is actually being scrolled, then
           fades out again after a short idle period. The is-scrolling
           class below is toggled by a scroll listener in the component. */
        html {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        html.is-scrolling {
          scrollbar-color: rgba(43, 58, 42, 0.35) transparent;
        }
        html::-webkit-scrollbar {
          width: 8px;
        }
        html::-webkit-scrollbar-track {
          background: transparent;
        }
        html::-webkit-scrollbar-thumb {
          background-color: transparent;
          border-radius: 4px;
          transition: background-color 0.4s ease;
        }
        html.is-scrolling::-webkit-scrollbar-thumb {
          background-color: rgba(43, 58, 42, 0.35);
        }
        html::-webkit-scrollbar-thumb:hover {
          background-color: rgba(43, 58, 42, 0.55) !important;
        }
        .romano-root .font-display { font-family: 'Fraunces', serif; }
        .romano-root .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--brass);
        }
        .romano-root .rule {
          height: 1px;
          background: linear-gradient(90deg, var(--ink) 0%, transparent 100%);
          opacity: 0.15;
        }
        .romano-root .btn-primary,
        .romano-root .btn-outline {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
          height: 48px;
          padding: 0 1.9rem;
          font-size: 0.82rem;
          letter-spacing: 0.04em;
          font-weight: 600;
          border-radius: 2px;
          transition: background 0.25s ease, color 0.25s ease, border-color 0.25s ease, transform 0.15s ease, box-shadow 0.25s ease;
        }
        .romano-root .btn-primary {
          background: var(--verde);
          color: var(--stone-light);
          border: 1px solid var(--verde);
          box-shadow: 0 1px 2px rgba(28,24,21,0.06);
        }
        .romano-root .btn-primary:hover {
          background: var(--verde-dark);
          border-color: var(--verde-dark);
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(23,33,26,0.22);
        }
        .romano-root .btn-primary:active { transform: translateY(0); box-shadow: 0 2px 6px rgba(23,33,26,0.18); }
        .romano-root .btn-outline {
          border: 1px solid rgba(28,24,21,0.55);
          color: var(--ink);
          background: transparent;
        }
        .romano-root .btn-outline:hover {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--stone-light);
          transform: translateY(-1px);
        }
        .romano-root .btn-outline:active { transform: translateY(0); }
        .romano-root a:focus-visible,
        .romano-root button:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 2px;
        }
        .romano-root .marquee-track {
          display: flex;
          width: max-content;
          animation: romano-marquee 28s linear infinite;
        }
        .romano-root .looks-marquee-track {
          animation: romano-looks-marquee 34s linear infinite;
        }
        .romano-root .looks-marquee-track:hover {
          animation-play-state: paused;
        }
        @keyframes romano-looks-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .romano-root .looks-marquee-track { animation: none; }
        }
        .romano-root .look-swatch {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
        }
        .romano-root .group:hover .look-swatch {
          transform: translateY(-6px);
          box-shadow: 0 24px 40px -14px rgba(28, 24, 21, 0.35);
        }
        .romano-root .look-swatch img {
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .romano-root .group:hover .look-swatch img {
          transform: scale(1.15);
        }
        @keyframes romano-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .romano-root .marquee-track { animation: none; }
        }
        .romano-root .card-swatch {
          transition: transform 0.4s ease;
        }
        .romano-root .collection-card:hover .card-swatch { transform: scale(1.04); }
        
        /* Nav links: underline animates in from the center on hover/focus,
           giving the jump-to-section click a bit of intentional motion. */
        .nav-link {
          position: relative;
          padding-bottom: 2px;
        }
        .nav-link::after {
          content: "";
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 0%;
          height: 1px;
          background: var(--verde);
          transition: width 0.3s ease, left 0.3s ease;
        }
        .nav-link:hover::after,
        .nav-link:focus-visible::after {
          width: 100%;
          left: 0%;
        }
        .search-backdrop {
          animation: romano-fade-in 0.18s ease;
        }
        .search-panel {
          animation: romano-rise-in 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes romano-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes romano-rise-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .search-result-row {
          transition: background 0.15s ease;
        }
        .search-result-row:hover,
        .search-result-row:focus-visible {
          background: rgba(43,58,42,0.06);
        }
        .kbd-hint {
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem;
          padding: 0.1rem 0.4rem;
          border-radius: 4px;
          border: 1px solid rgba(28,24,21,0.18);
          color: var(--ink);
          opacity: 0.55;
        }
      `}</style>

      {/* ---------------- NAV ---------------- */}
      <header
        className="sticky top-0 z-40 backdrop-blur border-b"
        style={{
          background: "rgba(237,230,216,0.92)",
          borderColor: "rgba(28,24,21,0.1)",
        }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18.5" stroke="var(--verde)" strokeWidth="1.2" />
              <text x="20" y="27" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="20" fill="var(--verde)">R</text>
            </svg>
            <span className="font-display text-sm tracking-[0.18em] uppercase">House of Romano</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <a href="#collections" className="nav-link hover:opacity-70">Collections</a>
            <a href="#atelier" className="nav-link hover:opacity-70">About</a>
            <a href="#looks" className="nav-link hover:opacity-70">Lookbook</a>
            <a href="#join" className="nav-link hover:opacity-70">Journal</a>
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <button aria-label="Search" onClick={openSearch} className="hover:opacity-70"><Search size={18} /></button>

            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-2 text-sm hover:opacity-70 max-w-[140px]">
                  <UserIcon size={18} />
                  <span className="truncate">{displayName}</span>
                </button>
                <div className="absolute right-0 top-full pt-2 hidden group-hover:block group-focus-within:block">
                  <div
                    className="rounded-sm py-2 w-44"
                    style={{ background: "var(--stone-light)", border: "1px solid rgba(28,24,21,0.12)", boxShadow: "0 12px 30px rgba(28,24,21,0.15)" }}
                  >
                    <p className="px-4 pb-2 mb-1 text-xs opacity-50 truncate border-b" style={{ borderColor: "rgba(28,24,21,0.1)" }}>
                      {user.email}
                    </p>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm hover:opacity-70 flex items-center gap-2"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <button onClick={() => openAuth("signin")} className="hover:opacity-70">Sign In</button>
                <span className="opacity-30">|</span>
                <button onClick={() => openAuth("signup")} className="hover:opacity-70">Sign Up</button>
              </div>
            )}

            <button aria-label="Cart" className="relative hover:opacity-70">
              <ShoppingBag size={18} />
              <span className="absolute -top-2 -right-2 text-[10px] w-4 h-4 flex items-center justify-center rounded-full" style={{ background: "var(--oxide)", color: "var(--stone-light)" }}>0</span>
            </button>
          </div>

          <button className="md:hidden" onClick={() => setNavOpen(!navOpen)} aria-label="Menu">
            {navOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {navOpen && (
          <div className="md:hidden px-6 pb-5 flex flex-col gap-4 text-sm">
            <button onClick={openSearch} className="text-left flex items-center gap-2">
              <Search size={15} /> Search
            </button>
            <a href="#collections" onClick={() => setNavOpen(false)}>Collections</a>
            <a href="#atelier" onClick={() => setNavOpen(false)}>About</a>
            <a href="#looks" onClick={() => setNavOpen(false)}>Lookbook</a>
            <a href="#join" onClick={() => setNavOpen(false)}>Journal</a>
            <div className="rule my-1" />
            {user ? (
              <>
                <p className="opacity-50 text-xs uppercase tracking-widest">Signed in as {displayName}</p>
                <button onClick={handleSignOut} className="text-left flex items-center gap-2">
                  <LogOut size={15} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <button onClick={() => openAuth("signin")} className="text-left">Sign In</button>
                <button onClick={() => openAuth("signup")} className="text-left">Sign Up</button>
              </>
            )}
          </div>
        )}
      </header>

      {/* ---------------- HERO ---------------- */}
      <section id="top" className="relative max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-16 md:pb-24 lg:pt-20 lg:pb-28">
        <div className="grid md:grid-cols-[1fr_400px] lg:grid-cols-[1fr_520px] gap-8 lg:gap-14 items-center">
          <div className="order-2 md:order-1 relative z-10">
            <span
              className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border"
              style={{ borderColor: "rgba(169,129,63,0.4)", background: "rgba(169,129,63,0.08)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--brass)" }} aria-hidden="true" />
              <span className="eyebrow mb-0">Multi-Brand · Online Only · Based in Cebu</span>
            </span>

            <h1 className="font-display text-[2.6rem] sm:text-5xl md:text-5xl lg:text-[3.4rem] leading-[1.08] mb-6 text-balance">
              Your favorite brands,{" "}
              <em style={{ fontStyle: "italic", color: "var(--verde)" }}>all in one closet.</em>
            </h1>

            <p className="text-base md:text-lg opacity-80 mb-9 max-w-md leading-relaxed">
              Jeans, shorts, jackets, caps, and everyday clothing from the brands you already trust.
              We check every piece before it ships, straight from Cebu to your door.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link href="/dashboard" className="btn-primary group">
                Shop Now
                <ArrowRight size={15} className="shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a href="#atelier" className="btn-outline">Why Shop With Us</a>
            </div>

            <div className="rule mb-6 max-w-md" />

            <div className="flex flex-wrap gap-x-7 gap-y-3">
              <span className="inline-flex items-center gap-2 text-sm opacity-75">
                <Truck size={16} style={{ color: "var(--brass)" }} /> Cash on delivery in Cebu City
              </span>
              <span className="inline-flex items-center gap-2 text-sm opacity-75">
                <CreditCard size={16} style={{ color: "var(--brass)" }} /> GCash &amp; bank transfer nationwide
              </span>
              <span className="inline-flex items-center gap-2 text-sm opacity-75">
                <BadgeCheck size={16} style={{ color: "var(--brass)" }} /> Every piece quality-checked
              </span>
            </div>
          </div>

          {/* Image sits in its own dedicated grid track (not absolutely
              positioned), so it can be sized generously without ever being
              able to overlap the copy — the columns are separate tracks. */}
          <div className="order-1 md:order-2 relative flex items-center justify-center pt-4 md:pt-0">
            <div
              className="hidden md:block absolute w-[120%] h-[120%] rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(169,129,63,0.16), transparent 70%)" }}
              aria-hidden="true"
            />

            <div className="relative z-10 w-full max-w-[260px] md:max-w-none flex flex-col items-center">
              <HeroImage className="w-full md:w-auto md:h-[480px] lg:h-[600px] aspect-[712/1024] mx-auto drop-shadow-[0_30px_40px_rgba(28,24,21,0.18)]" />
              {/* grounding shadow so the figure reads as standing in the frame, not floating */}
              <div
                className="w-[62%] h-3.5 md:h-4 rounded-full -mt-2 md:-mt-3"
                style={{ background: "radial-gradient(ellipse, rgba(28,24,21,0.22), transparent 72%)" }}
                aria-hidden="true"
              />
            </div>

            {/* trust card, grounded against the image so the illustration reads
                as part of a real storefront rather than a floating asset */}
            <div
              className="hidden sm:flex absolute left-0 bottom-6 md:bottom-10 z-20 items-center gap-3 pl-3 pr-4 py-3 rounded-sm"
              style={{ background: "var(--stone-light)", boxShadow: "0 16px 34px rgba(28,24,21,0.16)", border: "1px solid rgba(28,24,21,0.08)" }}
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "rgba(43,58,42,0.1)" }}
              >
                <BadgeCheck size={18} style={{ color: "var(--verde)" }} />
              </span>
              <span>
                <span className="block font-display text-sm leading-tight">Checked before it ships</span>
                <span className="block text-xs opacity-60 leading-tight">Every order, every time</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- MARQUEE ---------------- */}
      <div className="overflow-hidden border-y" style={{ borderColor: "rgba(28,24,21,0.12)", background: "var(--verde)" }}>
        <div className="marquee-track py-3">
          {/* We repeat the group 4 times so it's guaranteed to overflow the screen width seamlessly */}
          {[0, 1, 2, 3].map((rep) => (
            <div key={rep} className="flex shrink-0">
              {["COD IN CEBU", "GCASH ACCEPTED", "QUALITY CHECKED", "MULTI-BRAND SHOP", "NEW ARRIVALS", "DAILY WEAR", "SECURE CHECKOUT"].map((t, i) => (
                <span key={i} className="mx-6 text-xs tracking-[0.2em] uppercase whitespace-nowrap" style={{ color: "var(--stone-light)" }}>
                  {t} &nbsp;·
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ---------------- COLLECTIONS ---------------- */}
      <section id="collections" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <p className="eyebrow mb-3">The Rack</p>
            <h2 className="font-display text-3xl md:text-4xl">Shop By Category</h2>
          </div>
          <Link href="/categories" className="text-sm underline underline-offset-4 hover:opacity-70">View All</Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {COLLECTIONS.slice(0, 5).map((c, i) => (
            <Link href={`/dashboard?category=${encodeURIComponent(c.title)}`} key={i} className="collection-card group block">
              <div
                className="card-swatch aspect-[3/4] mb-4 rounded-sm relative overflow-hidden"
                style={{
                  background: c.image
                    ? "var(--stone)"
                    : `linear-gradient(150deg, ${c.swatch[0]}, ${c.swatch[1]})`,
                }}
              >
                {c.image && (
                  <img
                    src={c.image}
                    alt={c.title}
                    className="absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
                  />
                )}
              </div>
              <p className="text-xs uppercase tracking-[0.16em] opacity-60 mb-1">{c.ital}</p>
              <h3 className="font-display text-lg mb-1">{c.title}</h3>
              <p className="text-sm opacity-70 leading-snug">{c.copy}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------- BRANDS WE CARRY ---------------- */}
      {/* Edit BRANDS below to match what you actually stock/resell. */}
      <div className="border-y" style={{ borderColor: "rgba(28,24,21,0.12)", background: "var(--stone-light)" }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="eyebrow text-center mb-5">Brands We Carry</p>
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {["Levi's", "New Era", "Essentials", "Champion", "Dickies", "& More"].map((b, i) => (
              <span key={i} className="font-display text-lg md:text-xl opacity-60">{b}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------- ATELIER / STORY ---------------- */}
      <section id="atelier" className="border-y" style={{ borderColor: "rgba(28,24,21,0.12)", background: "var(--stone-light)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-14 items-center">
          <div
            className="aspect-[4/5] rounded-sm relative overflow-hidden"
          >
            <img
              src="/atelier-shop.jpg"
              alt="Inside House of Romano's shop in Cebu — racks of jackets, tees, caps, and shorts"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-3">Why Shop With Us</p>
            <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">Multiple brands, one trusted shop.</h2>
            <p className="opacity-80 leading-relaxed mb-8 max-w-md">
              We're a small, family-run clothing shop based in Cebu, Philippines, selling jeans, shorts,
              jackets, caps, and everyday clothing from brands you already know. Every item is checked
              for quality before it ships — with clear sizing, honest photos, and a real person to talk
              to if you need help.
            </p>
            <div className="grid grid-cols-2 gap-6 max-w-md">
              <div>
                <p className="font-display text-2xl">Cebu, PH</p>
                <p className="text-xs uppercase tracking-widest opacity-60 mt-1">Based In</p>
              </div>
              <div>
                <p className="font-display text-2xl">100% Online</p>
                <p className="text-xs uppercase tracking-widest opacity-60 mt-1">Order Anywhere</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- LOOKBOOK ---------------- */}
      <section id="looks" className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <p className="eyebrow mb-3">Style Guide</p>
        <h2 className="font-display text-3xl md:text-4xl mb-12">Five Ways To Wear It</h2>

        <div className="overflow-hidden -mx-6 px-6">
          <div className="looks-marquee-track flex gap-5 pb-4 w-max">
            {[0, 1].map((rep) => (
              <div key={rep} className="flex gap-5 shrink-0">
                {LOOKS.map((l) => (
                  <div key={`${rep}-${l.n}`} className="shrink-0 w-56 group">
                    <div
                      className="look-swatch aspect-[3/4] rounded-sm mb-4 relative overflow-hidden"
                      style={{ background: `linear-gradient(160deg, ${l.swatch[0]}, ${l.swatch[1]})` }}
                    >
                      {l.image && (
                        <img
                          src={l.image}
                          alt={l.name}
                          className="absolute inset-0 w-full h-full object-cover object-top"
                        />
                      )}
                    </div>
                    <p className="text-xs tracking-[0.16em] opacity-50 mb-1">LOOK {l.n}</p>
                    <h3 className="font-display text-base">{l.name}</h3>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- NEWSLETTER ---------------- */}
      <section id="join" style={{ background: "var(--verde-dark)", color: "var(--stone-light)" }}>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <p className="eyebrow mb-3" style={{ color: "var(--brass-light)" }}>Stay In The Loop</p>
            <h2 className="font-display text-2xl md:text-3xl leading-snug">
              Get notified when new stock and restocks drop.
            </h2>
          </div>
          <div>
            <form
              noValidate
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-3 items-start"
            >
              <label htmlFor="newsletter-email" className="sr-only">Email address</label>
              <div className="flex-1 w-full">
                <input
                  id="newsletter-email"
                  type="email"
                  value={newsletterEmail}
                  onChange={(e) => {
                    setNewsletterEmail(e.target.value);
                    if (newsletterStatus === "error") setNewsletterStatus("idle");
                  }}
                  placeholder="you@email.com"
                  disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                  aria-invalid={newsletterStatus === "error"}
                  aria-describedby="newsletter-feedback"
                  className="w-full px-4 py-3 text-sm rounded-sm bg-transparent border transition-colors"
                  style={{
                    borderColor:
                      newsletterStatus === "error"
                        ? "var(--oxide)"
                        : newsletterStatus === "success"
                        ? "var(--brass-light)"
                        : "rgba(246,241,231,0.35)",
                    color: "var(--stone-light)",
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={newsletterStatus === "loading" || newsletterStatus === "success"}
                className="btn-primary disabled:opacity-70"
                style={{ background: "var(--brass)", minWidth: "132px" }}
              >
                {newsletterStatus === "loading" && <Loader2 size={15} className="animate-spin" />}
                {newsletterStatus === "success" && <CheckCircle2 size={15} />}
                {newsletterStatus === "loading" ? "Signing Up…" : newsletterStatus === "success" ? "Subscribed" : "Sign Me Up"}
              </button>
            </form>

            <div id="newsletter-feedback" role="status" aria-live="polite" className="mt-3 min-h-[1.1rem]">
              {newsletterStatus === "error" && (
                <p className="text-xs" style={{ color: "var(--oxide)" }}>{newsletterError}</p>
              )}
              {newsletterStatus === "success" && (
                <p className="text-xs" style={{ color: "var(--brass-light)" }}>
                  You&apos;re on the list — thanks for signing up!
                </p>
              )}
              {newsletterStatus === "idle" && (
                <p className="text-xs opacity-50">No spam, just new arrivals. Unsubscribe any time.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12 text-sm">
          <div>
            <h4 className="font-display text-lg mb-4">House of Romano</h4>
            <p className="opacity-70 leading-relaxed max-w-[220px]">Multi-brand clothing, sold online. Based in Cebu, Philippines.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-50 mb-4">Shop</p>
            <ul className="space-y-2 opacity-80">
              <li>Jeans</li><li>Shorts</li><li>Jackets</li><li>Caps</li><li>T-Shirts</li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-50 mb-4">About</p>
            <ul className="space-y-2 opacity-80">
              <li>Our Story</li><li>Brands We Carry</li><li>Quality Promise</li>
            </ul>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest opacity-50 mb-4">Help</p>
            <ul className="space-y-2 opacity-80">
              <li>Sizing Guide</li><li>Shipping &amp; Payment</li><li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="rule mb-6" />
        <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs opacity-50">
          <p>© 2026 House of Romano. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:opacity-100" aria-label="Visit our Instagram">Instagram</a>
            <a href="#" className="hover:opacity-100" aria-label="Visit our Facebook Page">Facebook</a>
            <a href="#" className="hover:opacity-100" aria-label="Read our Terms of Service">Terms</a>
          </div>
        </div>
      </footer>

      {/* ---------------- SEARCH OVERLAY ---------------- */}
      {searchOpen && (
        <div
          className="search-backdrop fixed inset-0 z-50 flex items-start justify-center px-4 pt-24 md:pt-32"
          style={{ background: "rgba(28,24,21,0.55)" }}
          onClick={closeSearch}
        >
          <div
            className="search-panel w-full max-w-xl rounded-sm overflow-hidden"
            style={{ background: "var(--stone-light)", boxShadow: "0 24px 60px rgba(28,24,21,0.35)" }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
          >
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 px-5 border-b" style={{ borderColor: "rgba(28,24,21,0.1)" }}>
              <Search size={18} className="opacity-50 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search jeans, jackets, caps…"
                className="flex-1 bg-transparent py-4 text-sm outline-none"
                style={{ color: "var(--ink)" }}
                aria-label="Search categories and looks"
              />
              <button type="button" onClick={closeSearch} aria-label="Close search" className="opacity-50 hover:opacity-90 shrink-0">
                <X size={18} />
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto py-2">
              {searchResults.categories.length === 0 && searchResults.looks.length === 0 ? (
                <p className="px-5 py-8 text-sm text-center opacity-60">
                  No results for &ldquo;{searchQuery}&rdquo;. Try a different word.
                </p>
              ) : (
                <>
                  {searchResults.categories.length > 0 && (
                    <div className="mb-1">
                      <p className="px-5 pt-3 pb-1 text-xs uppercase tracking-widest opacity-45">
                        {searchQuery ? "Categories" : "Popular Categories"}
                      </p>
                      {searchResults.categories.map((c) => (
                        <button
                          key={c.slug}
                          onClick={() => goToCategory(c.slug)}
                          className="search-result-row w-full flex items-center gap-4 px-5 py-3 text-left"
                        >
                          <span
                            className="w-9 h-11 rounded-sm shrink-0"
                            style={{ background: `linear-gradient(150deg, ${c.swatch[0]}, ${c.swatch[1]})` }}
                          />
                          <span>
                            <span className="block font-display text-base">{c.title}</span>
                            <span className="block text-xs opacity-60">{c.copy}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.looks.length > 0 && (
                    <div className="mb-1">
                      <p className="px-5 pt-3 pb-1 text-xs uppercase tracking-widest opacity-45">Lookbook</p>
                      {searchResults.looks.map((l) => (
                        <Link
                          key={l.n}
                          href="/#looks"
                          onClick={closeSearch}
                          className="search-result-row w-full flex items-center gap-4 px-5 py-3 text-left"
                        >
                          <span
                            className="w-9 h-11 rounded-sm shrink-0"
                            style={{ background: `linear-gradient(160deg, ${l.swatch[0]}, ${l.swatch[1]})` }}
                          />
                          <span className="font-display text-base">{l.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="hidden sm:flex items-center justify-between px-5 py-3 border-t text-xs opacity-50" style={{ borderColor: "rgba(28,24,21,0.1)" }}>
              <span>Press Enter to open the top result</span>
              <span className="flex items-center gap-1">
                <kbd className="kbd-hint">Esc</kbd> to close
              </span>
            </div>
          </div>
        </div>
      )}

      <AuthModal open={authOpen} initialMode={authMode} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
