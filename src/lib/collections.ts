import { supabaseServer } from "@/lib/supabase/server";

export type Collection = {
  id?: string;
  title: string;
  ital: string;
  copy: string;
  swatch: [string, string];
  slug: string;
  image?: string;
};

/**
 * Fallback list — used only if the "categories" table is empty
 * or the fetch fails (e.g. offline, first load before data exists).
 */
export const COLLECTIONS: Collection[] = [
  {
    title: "Jeans",
    ital: "Classic Denim",
    copy: "Everyday denim built for comfort and long-lasting wear.",
    swatch: ["#2B3A2A", "#425443"],
    slug: "jeans",
    image: "/category/jeans.png",
  },
  {
    title: "Shorts",
    ital: "Easy Fit",
    copy: "Lightweight shorts designed for warm days and active movement.",
    swatch: ["#A9813F", "#C7A467"],
    slug: "shorts",
    image: "/category/shorts.png",
  },
  {
    title: "Jackets",
    ital: "Outer Layers",
    copy: "Stylish jackets to keep you warm and pull your look together.",
    swatch: ["#8A3B2A", "#B15A42"],
    slug: "jackets",
    image: "/category/jacket.png",
  },
  {
    title: "Caps",
    ital: "Headwear",
    copy: "Clean caps that add a sharp finish to any casual outfit.",
    swatch: ["#3A3530", "#5C554C"],
    slug: "caps",
    image: "/category/caps.png",
  },
  {
    title: "T-Shirts",
    ital: "Essential Tees",
    copy: "Soft cotton shirts featuring clean prints and easy everyday style.",
    swatch: ["#1C2620", "#2B3A2A"],
    slug: "t-shirts",
    image: "/category/tshirt.png",
  },
  {
    title: "Polo Shirts",
    ital: "Smart Casual",
    copy: "Polished polo shirts that bridge the gap between casual and formal.",
    swatch: ["#425443", "#2B3A2A"],
    slug: "polo-shirts",
    image: "/category/polo.png",
  },
];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Live fetch of every row in the "categories" table, shaped into
 * the same Collection type the UI already expects.
 *
 * Falls back to the static COLLECTIONS list if the table is empty
 * or the query errors out, so the storefront never renders blank.
 */
export async function fetchCollections(): Promise<Collection[]> {
  const { data, error } = await supabaseServer
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("fetchCollections error:", error.message);
    return COLLECTIONS;
  }

  if (!data || data.length === 0) {
    return COLLECTIONS;
  }

  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    ital: row.ital || "",
    copy: row.copy || "",
    swatch: [row.swatch_from || "#2B3A2A", row.swatch_to || "#1C2620"] as [string, string],
    slug: row.slug || slugify(row.title),
    image: row.image || undefined,
  }));
}
