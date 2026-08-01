import Link from "next/link";
import { fetchCollections } from "@/lib/collections";

/* ------------------------------------------------------------------ */
/*  /categories — index of every shop category.                       */
/*  Same travertine / verde / brass token system as the home page,     */
/*  scoped locally so this route doesn't depend on the home page       */
/*  mounting first.                                                    */
/*                                                                      */
/*  Cards link straight into the dashboard's Shop tab with the         */
/*  category pre-selected (?category=Jackets), instead of the old      */
/*  standalone /categories/[slug] "coming soon" page.                  */
/*                                                                      */
/*  Categories are fetched live from Supabase on every request, so     */
/*  anything added/edited/deleted in the admin panel shows up here     */
/*  immediately without a redeploy.                                    */
/* ------------------------------------------------------------------ */

// Always hit the database fresh — don't let Next.js cache this route,
// otherwise newly added categories won't appear until a rebuild.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Shop By Category — House of Romano",
  description: "Jeans, shorts, jackets, caps, and everyday clothing from the brands you already trust.",
};

export default async function CategoriesIndexPage() {
  const collections = await fetchCollections();

  return (
    <div className="romano-cat-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&display=swap');
        .romano-cat-root {
          --stone: #EDE6D8;
          --stone-light: #F6F1E7;
          --ink: #1C1815;
          --verde: #2B3A2A;
          --verde-dark: #17211A;
          --brass: #A9813F;
          --brass-light: #C7A467;
          background: var(--stone);
          color: var(--ink);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
        }
        .romano-cat-root .font-display { font-family: 'Fraunces', serif; }
        .romano-cat-root .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.22em;
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--brass);
        }
        .romano-cat-root .rule {
          height: 1px;
          background: linear-gradient(90deg, var(--ink) 0%, transparent 100%);
          opacity: 0.15;
        }
        .romano-cat-root .card-swatch {
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s ease;
          box-shadow: 0 0 0 rgba(28, 24, 21, 0);
        }
        .romano-cat-root .collection-card:hover .card-swatch {
          transform: translateY(-8px);
          box-shadow: 0 30px 50px -16px rgba(28, 24, 21, 0.4);
        }
        .romano-cat-root .card-swatch img {
          transition: transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .romano-cat-root .collection-card:hover .card-swatch img {
          transform: scale(1.28);
        }
        .romano-cat-root a:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 2px;
        }
      `}</style>

      <header className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/" className="text-sm inline-flex items-center gap-2 hover:opacity-70">
          ← Back to House of Romano
        </Link>
      </header>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <p className="eyebrow mb-3">The Rack</p>
        <h1 className="font-display text-3xl md:text-4xl mb-3">Shop By Category</h1>
        <p className="opacity-70 max-w-md mb-12">
          Every category we carry, all checked for quality before it ships from Cebu.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((c) => (
            <Link
              href={`/dashboard?category=${encodeURIComponent(c.title)}`}
              key={c.id ?? c.slug}
              className="collection-card group block"
            >
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
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
              </div>
              <p className="text-xs uppercase tracking-[0.16em] opacity-60 mb-1">{c.ital}</p>
              <h3 className="font-display text-lg mb-1">{c.title}</h3>
              <p className="text-sm opacity-70 leading-snug">{c.copy}</p>
            </Link>
          ))}
          {collections.length === 0 && (
            <p className="opacity-60 text-sm">No categories yet — check back soon.</p>
          )}
        </div>
      </section>
    </div>
  );
}
