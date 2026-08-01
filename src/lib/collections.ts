export type Collection = {
  title: string;
  ital: string;
  copy: string;
  swatch: [string, string];
  slug: string;
  image?: string;
};

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