import Link from "next/link";
import { ArrowRight, MapPin, BadgeCheck, Calendar } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  House of Romano — About / Our Story page                          */
/*  Drop this file at: src/app/about/page.tsx                         */
/*                                                                      */
/*  IMAGES: already saved in /public/about/ as:                       */
/*    owner.png, closet-1.jpg, closet-2.jpg, caps.jpg                 */
/*                                                                      */
/*  NOTE: your site's colors/fonts (--stone, --brass, .font-display,  */
/*  .eyebrow, .btn-primary, etc.) live in an inline <style> block      */
/*  inside the homepage's page.tsx, scoped to a .romano-root wrapper  */
/*  — NOT in globals.css. This page recreates that same wrapper +     */
/*  the subset of styles it needs, so it renders consistently even    */
/*  though the two pages don't share a layout component.              */
/* ------------------------------------------------------------------ */

export default function AboutPage() {
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
        .romano-root a:focus-visible,
        .romano-root button:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 2px;
        }
      `}</style>

      {/* ---------------- SIMPLE HEADER ---------------- */}
      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
        <Link href="/" className="font-display text-lg">
          House of Romano
        </Link>
        <Link href="/" className="text-sm underline underline-offset-4 hover:opacity-70">
          Back to Shop
        </Link>
      </header>

      {/* ---------------- HERO ---------------- */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-16 md:pt-14 md:pb-24">
        <p className="eyebrow mb-3">Our Story</p>
        <h1 className="font-display text-4xl md:text-5xl leading-tight max-w-2xl mb-6">
          Started in a closet in Cebu, February 2025.
        </h1>
        <p className="opacity-80 leading-relaxed max-w-xl text-base md:text-lg">
          House of Romano began as a personal collection of jeans, jackets, caps, and
          tees — sourced, checked, and sold one piece at a time by someone who actually
          wears this stuff. No warehouse, no middlemen. Just a real closet in Cebu,
          Philippines, and a habit of finding good pieces from brands worth carrying.
        </p>
      </section>

      {/* ---------------- FOUNDER ---------------- */}
      <section className="border-y" style={{ borderColor: "rgba(28,24,21,0.12)", background: "var(--stone-light)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-14 items-center">
          <div className="aspect-[4/5] rounded-sm relative overflow-hidden order-2 md:order-1">
            <img
              src="/about/owner.png"
              alt="Founder of House of Romano"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="order-1 md:order-2">
            <p className="eyebrow mb-3">The Person Behind It</p>
            <h2 className="font-display text-3xl md:text-4xl mb-6 leading-tight">
              One owner. One closet. Every order checked by hand.
            </h2>
            <p className="opacity-80 leading-relaxed mb-8 max-w-md">
              House of Romano isn&apos;t a big operation — it&apos;s run by one person who
              picks every piece personally, checks it for quality before it ships, and
              answers messages directly. If something&apos;s not right, there&apos;s a real
              person on the other end to sort it out.
            </p>
            <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div className="flex items-center gap-2 opacity-80">
                <Calendar size={16} style={{ color: "var(--brass)" }} />
                Selling since February 2025
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <MapPin size={16} style={{ color: "var(--brass)" }} />
                Based in Cebu, Philippines
              </div>
              <div className="flex items-center gap-2 opacity-80">
                <BadgeCheck size={16} style={{ color: "var(--brass)" }} />
                Every item hand-checked
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- FROM OUR CLOSET ---------------- */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-28">
        <p className="eyebrow mb-3">Where It Starts</p>
        <h2 className="font-display text-3xl md:text-4xl mb-12 max-w-xl">
          From our closet to your doorstep.
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="sm:col-span-2 lg:col-span-1 lg:row-span-2">
            <div className="aspect-[3/4] lg:aspect-[3/5] rounded-sm relative overflow-hidden mb-4">
              <img
                src="/about/closet-1.jpg"
                alt="Rail of jackets, hoodies, and varsity pieces ready to be listed"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="text-sm opacity-70 leading-snug">
              Jackets and outerwear, hung and checked before they&apos;re ever photographed.
            </p>
          </div>
          <div>
            <div className="aspect-[4/3] rounded-sm relative overflow-hidden mb-4">
              <img
                src="/about/caps.jpg"
                alt="Snapback caps laid out for a product photo"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="text-sm opacity-70 leading-snug">
              Caps sourced in small batches, colorway by colorway.
            </p>
          </div>
          <div>
            <div className="aspect-[4/3] rounded-sm relative overflow-hidden mb-4">
              <img
                src="/about/closet-2.jpg"
                alt="Folded tees and hoodies from brands like Champion and Essentials"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <p className="text-sm opacity-70 leading-snug">
              Tees and hoodies, folded and shelved — the same way they&apos;ll reach you.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- QUALITY PROMISE STRIP ---------------- */}
      <section style={{ background: "var(--verde-dark)", color: "var(--stone-light)" }}>
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-3 gap-10 text-center md:text-left">
          <div>
            <h3 className="font-display text-xl mb-2">Personally Sourced</h3>
            <p className="text-sm opacity-75 leading-relaxed">
              Every piece is chosen by hand, not bulk-ordered from a catalog.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl mb-2">Quality Checked</h3>
            <p className="text-sm opacity-75 leading-relaxed">
              Inspected for wear, stitching, and true-to-photo condition before it ships.
            </p>
          </div>
          <div>
            <h3 className="font-display text-xl mb-2">Real Support</h3>
            <p className="text-sm opacity-75 leading-relaxed">
              Message the shop directly — there&apos;s always a real person replying.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="max-w-6xl mx-auto px-6 py-20 md:py-24 text-center">
        <h2 className="font-display text-3xl md:text-4xl mb-6">Take a look around.</h2>
        <Link href="/#collections" className="btn-primary inline-flex items-center gap-2">
          Shop the Collection <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}
