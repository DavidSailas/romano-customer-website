import Link from "next/link";
import { notFound } from "next/navigation";
import { COLLECTIONS } from "@/lib/collections";

/* ------------------------------------------------------------------ */
/*  /categories/[slug] — single category landing page.                 */
/*  Product data isn't wired up yet, so this renders the category      */
/*  header plus an honest "coming soon" state rather than fake         */
/*  product cards. Swap the empty-state block for a real product grid  */
/*  once you have a products table/query to plug in.                   */
/* ------------------------------------------------------------------ */

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: Props) {
  const category = COLLECTIONS.find((c) => c.slug === params.slug);
  if (!category) return { title: "Category Not Found — House of Romano" };
  return {
    title: `${category.title} — House of Romano`,
    description: category.copy,
  };
}

export default function CategoryPage({ params }: Props) {
  const category = COLLECTIONS.find((c) => c.slug === params.slug);
  if (!category) notFound();

  const otherCategories = COLLECTIONS.filter((c) => c.slug !== category.slug);

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
        .romano-cat-root .btn-primary {
          background: var(--verde);
          color: var(--stone-light);
          padding: 0.85rem 1.9rem;
          font-size: 0.82rem;
          letter-spacing: 0.04em;
          font-weight: 500;
          border-radius: 2px;
          transition: background 0.25s ease, transform 0.25s ease;
          display: inline-block;
        }
        .romano-cat-root .btn-primary:hover { background: var(--verde-dark); transform: translateY(-1px); }
        .romano-cat-root a:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 2px;
        }
      `}</style>

      <header className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-sm">
        <Link href="/" className="hover:opacity-70">← House of Romano</Link>
        <Link href="/categories" className="opacity-60 hover:opacity-100">All Categories</Link>
      </header>

      {/* ---------------- CATEGORY HERO ---------------- */}
      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-[320px_1fr] gap-10 items-end">
        <div
          className="aspect-[3/4] rounded-sm"
          style={{ background: `linear-gradient(150deg, ${category.swatch[0]}, ${category.swatch[1]})` }}
          aria-hidden="true"
        />
        <div>
          <p className="eyebrow mb-3">{category.ital}</p>
          <h1 className="font-display text-4xl md:text-5xl mb-4">{category.title}</h1>
          <p className="opacity-75 max-w-md leading-relaxed">{category.copy}</p>
        </div>
      </section>

      <div className="rule max-w-6xl mx-auto mb-16" />

      {/* ---------------- EMPTY STATE ---------------- */}
      {/* Honest placeholder until a real product catalog is wired in —
          intentionally not fake product cards. */}
      <section className="max-w-6xl mx-auto px-6 pb-24 text-center">
        <p className="font-display text-2xl mb-3">New {category.title.toLowerCase()} landing soon.</p>
        <p className="opacity-70 max-w-md mx-auto mb-8">
          We're still loading this category's stock. Message us for what's in right now, or browse
          what's already live in other categories.
        </p>
        <Link href="/" className="btn-primary">Back To Shop</Link>
      </section>

      {/* ---------------- OTHER CATEGORIES ---------------- */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <p className="eyebrow mb-6 text-center">Also In The Rack</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {otherCategories.map((c) => (
            <Link href={`/categories/${c.slug}`} key={c.slug} className="group block">
              <div
                className="aspect-[3/4] mb-3 rounded-sm transition-transform duration-300 group-hover:scale-[1.03]"
                style={{ background: `linear-gradient(150deg, ${c.swatch[0]}, ${c.swatch[1]})` }}
              />
              <h3 className="font-display text-base">{c.title}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
