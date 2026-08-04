"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  House of Romano — News                                             */
/*  Announcements, drops, and updates from the shop. Uses the same     */
/*  travertine / deep green / brass visual language as the landing     */
/*  page, kept as its own route so it can grow independently.          */
/* ------------------------------------------------------------------ */

type NewsItem = {
  slug: string;
  date: string;
  category: string;
  title: string;
  excerpt: string;
};

// Replace with real posts, or swap this for a fetch from your database
// once you're ready to manage news from the admin dashboard.
const NEWS_ITEMS: NewsItem[] = [
  {
    slug: "new-arrivals-denim",
    date: "August 1, 2026",
    category: "New Arrivals",
    title: "Fresh denim just landed",
    excerpt: "New washes and fits from Levi's are now in stock, including a few limited sizes that sell out fast.",
  },
  {
    slug: "cebu-pop-up",
    date: "July 18, 2026",
    category: "Events",
    title: "Meet us at our first pop-up in Cebu City",
    excerpt: "Try before you buy. We're setting up a one-day shop with our full jacket and cap lineup — details inside.",
  },
  {
    slug: "shipping-update",
    date: "July 5, 2026",
    category: "Store Update",
    title: "Faster shipping across the Visayas",
    excerpt: "We've partnered with a new courier to cut delivery time for orders outside Metro Cebu.",
  },
];

export default function NewsPage() {
  return (
    <div className="romano-root min-h-screen">
      <style jsx global>{`
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
          font-family: 'Inter', system-ui, sans-serif;
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
        .romano-root .news-card {
          background: var(--stone-light);
          border: 1px solid rgba(28,24,21,0.1);
          transition: border-color 0.2s ease, transform 0.2s ease;
        }
        .romano-root .news-card:hover {
          border-color: rgba(169,129,63,0.5);
          transform: translateY(-2px);
        }
      `}</style>

      {/* ---------------- NAV ---------------- */}
      <header
        className="sticky top-0 z-40 backdrop-blur border-b"
        style={{ background: "rgba(237,230,216,0.92)", borderColor: "rgba(28,24,21,0.1)" }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18.5" stroke="var(--verde)" strokeWidth="1.2" />
              <text x="20" y="27" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="20" fill="var(--verde)">R</text>
            </svg>
            <span className="font-display text-sm tracking-[0.18em] uppercase">House of Romano</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link href="/#collections" className="hover:opacity-70">Collections</Link>
            <Link href="/#atelier" className="hover:opacity-70">About</Link>
            <Link href="/#looks" className="hover:opacity-70">Lookbook</Link>
            <Link href="/news" className="hover:opacity-70" style={{ color: "var(--brass)" }}>News</Link>
            <Link href="/dashboard" className="hover:opacity-70">Store</Link>
          </nav>

          <Link href="/dashboard" className="text-sm hover:opacity-70">Store</Link>
        </div>
      </header>

      {/* ---------------- HEADER ---------------- */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-10 md:pt-20">
        <p className="eyebrow mb-3">Latest Updates</p>
        <h1 className="font-display text-4xl md:text-5xl mb-4">News</h1>
        <p className="text-sm md:text-base opacity-70 max-w-xl">
          New arrivals, store updates, and things worth knowing — straight from House of Romano.
        </p>
      </section>

      {/* ---------------- NEWS LIST ---------------- */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="rule mb-10" />

        <div className="grid md:grid-cols-2 gap-6">
          {NEWS_ITEMS.map((item) => (
            <article key={item.slug} className="news-card rounded-sm p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-3 text-xs">
                <span className="eyebrow" style={{ color: "var(--brass)" }}>{item.category}</span>
                <span className="opacity-40">·</span>
                <span className="opacity-60">{item.date}</span>
              </div>
              <h2 className="font-display text-xl md:text-2xl mb-2">{item.title}</h2>
              <p className="text-sm opacity-70 leading-relaxed mb-5">{item.excerpt}</p>
              <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium" style={{ color: "var(--verde)" }}>
                Read more <ArrowRight size={14} />
              </span>
            </article>
          ))}
        </div>

        {NEWS_ITEMS.length === 0 && (
          <p className="text-sm opacity-60 py-16 text-center">No news yet — check back soon.</p>
        )}

        <div className="mt-14">
          <Link href="/" className="inline-flex items-center gap-2 text-sm hover:opacity-70">
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer className="max-w-6xl mx-auto px-6 py-16 border-t" style={{ borderColor: "rgba(28,24,21,0.1)" }}>
        <div className="flex flex-col sm:flex-row justify-between gap-3 text-xs opacity-50">
          <p>© 2026 House of Romano. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="#" className="hover:opacity-100" aria-label="Visit our Instagram">Instagram</a>
            <a href="#" className="hover:opacity-100" aria-label="Visit our Facebook Page">Facebook</a>
            <a href="#" className="hover:opacity-100" aria-label="Read our Terms of Service">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
