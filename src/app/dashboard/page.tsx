"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import {
  Package,
  UserCircle,
  ShoppingBag,
  Mail,
  MapPin,
  Phone,
  Pencil,
  ArrowRight,
  Shirt,
  Truck,
  CheckCircle2,
  Star,
  X,
  Trash2,
  LocateFixed,
  Home,
  Briefcase,
  Loader2,
  LogOut,
  MessageCircle,
  Send,
  ShieldCheck,
  Zap,
  Wallet,
  Landmark,
  Banknote,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useUser } from "@/lib/supabase/useUser";

// Matches the public.products table (see admin Manage Products page).
type Item = {
  id: string;
  title: string;
  category: string;
  price: number;
  stock: number;
  image_url: string | null;
  image_urls?: string[] | null;
  sizes: string[] | null;
  brand?: string | null;
  style?: string | null;
  color?: string | null;
  condition?: string | null;
};

// Fallback only — used if the "categories" table is empty or the fetch fails.
// The real filter list is loaded live from Supabase (see the `categories` state below).
const FALLBACK_CATEGORIES = ["All", "T-Shirts", "Polo Shirts", "Jackets", "Caps", "Shorts", "Jeans"];

// Full list of Philippine provinces (+ NCR), used to power the typeable Province combobox.
const PH_PROVINCES = [
  "Abra", "Agusan del Norte", "Agusan del Sur", "Aklan", "Albay", "Antique", "Apayao", "Aurora",
  "Basilan", "Bataan", "Batanes", "Batangas", "Benguet", "Biliran", "Bohol", "Bukidnon", "Bulacan",
  "Cagayan", "Camarines Norte", "Camarines Sur", "Camiguin", "Capiz", "Catanduanes", "Cavite", "Cebu",
  "Cotabato", "Davao de Oro", "Davao del Norte", "Davao del Sur", "Davao Occidental", "Davao Oriental",
  "Dinagat Islands", "Eastern Samar", "Guimaras", "Ifugao", "Ilocos Norte", "Ilocos Sur", "Iloilo",
  "Isabela", "Kalinga", "La Union", "Laguna", "Lanao del Norte", "Lanao del Sur", "Leyte",
  "Maguindanao del Norte", "Maguindanao del Sur", "Marinduque", "Masbate", "Metro Manila (NCR)",
  "Misamis Occidental", "Misamis Oriental", "Mountain Province", "Negros Occidental", "Negros Oriental",
  "Northern Samar", "Nueva Ecija", "Nueva Vizcaya", "Occidental Mindoro", "Oriental Mindoro", "Palawan",
  "Pampanga", "Pangasinan", "Quezon", "Quirino", "Rizal", "Romblon", "Samar", "Sarangani", "Siquijor",
  "Sorsogon", "South Cotabato", "Southern Leyte", "Sultan Kudarat", "Sulu", "Surigao del Norte",
  "Surigao del Sur", "Tarlac", "Tawi-Tawi", "Zambales", "Zamboanga del Norte", "Zamboanga del Sur",
  "Zamboanga Sibugay",
];

// Cities and municipalities of Cebu province (where House of Romano ships most often),
// plus a handful of other major PH cities so the field is still useful outside Cebu.
const CEBU_CITIES_MUNICIPALITIES = [
  "Cebu City", "Mandaue City", "Lapu-Lapu City", "Talisay City", "Danao City", "Toledo City",
  "Carcar City", "Naga City", "Bogo City",
  "Alcantara", "Alcoy", "Alegria", "Aloguinsan", "Argao", "Asturias", "Badian", "Balamban",
  "Bantayan", "Barili", "Boljoon", "Borbon", "Carmen", "Catmon", "Compostela", "Consolacion",
  "Cordova", "Daanbantayan", "Dalaguete", "Dumanjug", "Ginatilan", "Liloan", "Madridejos",
  "Malabuyoc", "Medellin", "Minglanilla", "Moalboal", "Oslob", "Pilar", "Pinamungajan", "Poro",
  "Ronda", "Samboan", "San Fernando", "San Francisco", "San Remigio", "Santa Fe", "Santander",
  "Sibonga", "Sogod", "Tabogon", "Tabuelan", "Tuburan", "Tudela",
];

const OTHER_MAJOR_PH_CITIES = [
  "Manila", "Quezon City", "Makati", "Taguig", "Pasig", "Pasay", "Mandaluyong", "Marikina",
  "Caloocan", "Las Piñas", "Muntinlupa", "Parañaque", "Valenzuela", "Davao City", "Zamboanga City",
  "Cagayan de Oro", "Bacolod", "Iloilo City", "General Santos", "Baguio City", "Angeles City",
  "Batangas City", "Lucena City", "Legazpi City", "Puerto Princesa", "Tacloban City", "Butuan City",
  "Cotabato City", "Dumaguete City", "Tagbilaran City",
];

const CITY_OPTIONS = [...CEBU_CITIES_MUNICIPALITIES, ...OTHER_MAJOR_PH_CITIES];

type PaymentMethod = "gcash" | "cod" | "bank";

const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string; icon: typeof Wallet }[] = [
  { id: "gcash", label: "GCash", description: "Pay via GCash e-wallet transfer", icon: Wallet },
  { id: "cod", label: "Cash on Delivery", description: "Pay in cash when your order arrives", icon: Banknote },
  { id: "bank", label: "Bank Transfer", description: "Pay via direct bank deposit or transfer", icon: Landmark },
];

// NOTE: replace these with House of Romano's real GCash / bank details before going live.
function paymentInstructions(method: PaymentMethod | null, total: number) {
  const amount = `₱${total.toLocaleString()}`;
  if (method === "gcash") {
    return `Send ${amount} to GCash 0917 000 0000 (House of Romano). Keep your receipt — we'll confirm as soon as payment is verified.`;
  }
  if (method === "bank") {
    return `Transfer ${amount} to BDO Savings 0012 3456 789 (House of Romano). Send us your proof of payment through chat support.`;
  }
  if (method === "cod") {
    return `Pay in cash when your order arrives. Please have ${amount} ready for the rider.`;
  }
  return "";
}

function calculateDeliveryFee(city: string): number {
  const normalized = city.trim().toLowerCase();
  if (normalized.includes("minglanilla")) {
    return 60; // Local delivery fee for Lipata/Minglanilla
  } else if (normalized.includes("naga")) {
    return 100;
  } else if (normalized.includes("lapu-lapu") || normalized.includes("cebu city")) {
    return 150;
  }
  return 150; // Default out-of-town delivery fee
}

type Tab = "shop" | "orders" | "account";

type OrderStatus = "placed" | "shipped" | "out_for_delivery" | "delivered" | "completed";

type Order = {
  id: string;
  itemName: string;
  brand: string;
  price: number;
  date: string;
  status: OrderStatus;
  swatch: [string, string];
};

const INITIAL_ORDERS: Order[] = [
  { id: "ORD-1042", itemName: "Pique Polo", brand: "Ralph Lauren", price: 950, date: "July 26, 2026", status: "out_for_delivery", swatch: ["#2B3A2A", "#425443"] },
  { id: "ORD-1039", itemName: "Straight Leg Denim", brand: "Levi's", price: 1250, date: "July 20, 2026", status: "delivered", swatch: ["#1C2620", "#2B3A2A"] },
];

const TRACKING_STEPS = ["Order Placed", "Shipped", "Out for Delivery", "Delivered"];

function stepIndex(status: OrderStatus) {
  if (status === "placed") return 0;
  if (status === "shipped") return 1;
  if (status === "out_for_delivery") return 2;
  return 3;
}

type Feedback = { rating: number; comment: string; submitted: boolean };

type AddressLabel = "Home" | "Work" | "Other";

type Address = {
  houseStreet: string;
  barangay: string;
  city: string;
  province: string;
  postalCode: string;
  label: AddressLabel;
  lat: number | null;
  lng: number | null;
};

const EMPTY_ADDRESS: Address = {
  houseStreet: "",
  barangay: "",
  city: "",
  province: "",
  postalCode: "",
  label: "Home",
  lat: null,
  lng: null,
};

function isAddressEmpty(a: Address) {
  return !a.houseStreet && !a.barangay && !a.city && !a.province;
}

function formatAddress(a: Address) {
  return [a.houseStreet, a.barangay, a.city, a.province, a.postalCode].filter(Boolean).join(", ");
}

type ChatMessage = {
  id: string;
  sender: "customer" | "admin";
  content: string;
  created_at: string;
  read?: boolean;
};

function formatChatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function DashboardPageInner() {
  const { user } = useUser();
  const [tab, setTab] = useState<Tab>("shop");
  const [category, setCategory] = useState<string>("All");
  const [categories, setCategories] = useState<string[]>(["All"]);

  // Load the real category list from Supabase so filter pills always match
  // whatever exists in the admin panel (instead of a hardcoded array).
  useEffect(() => {
    let mounted = true;
    supabase
      .from("categories")
      .select("title")
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error || !data || data.length === 0) {
          setCategories(FALLBACK_CATEGORIES);
          return;
        }
        setCategories(["All", ...data.map((row: any) => row.title)]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const [products, setProducts] = useState<Item[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedForCheckout, setSelectedForCheckout] = useState<string[]>([]);

  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});

  function pickSize(productId: string, size: string) {
    setSelectedSizes((prev) => ({ ...prev, [productId]: size }));
  }

  // Quick View modal: click any product card to see a larger image plus
  // similar pieces (matched by shared words in the title, e.g. "Fear of God").
  const [quickViewItem, setQuickViewItem] = useState<Item | null>(null);
  const [quickViewImageIndex, setQuickViewImageIndex] = useState(0);

  function openQuickView(item: Item) {
    setQuickViewItem(item);
    setQuickViewImageIndex(0);
  }

  function closeQuickView() {
    setQuickViewItem(null);
  }

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<Item[]>([]);
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [checkoutAddress, setCheckoutAddress] = useState<Address>(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [checkoutFormError, setCheckoutFormError] = useState("");
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState("");

  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  const [editingContact, setEditingContact] = useState(false);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<Address>(EMPTY_ADDRESS);
  const [fullName, setFullName] = useState("");
  const [savingContact, setSavingContact] = useState(false);
  const [contactError, setContactError] = useState("");
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState("");

  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const searchParams = useSearchParams();

  // If we arrived from a category card (/dashboard?category=Jackets),
  // switch to the Shop tab and pre-select that category filter.
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat && categories.includes(cat)) {
      setTab("shop");
      setCategory(cat);
    }
  }, [searchParams, categories]);

  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Fetch real products (with images) from the admin-managed products table
  useEffect(() => {
    async function fetchProducts() {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, title, category, price, stock, sizes, image_url, image_urls, brand, style, color, condition")
        .order("created_at", { ascending: false });

      if (data && !error) setProducts(data as Item[]);
      setLoadingProducts(false);
    }
    fetchProducts();

    // Live-sync the storefront whenever the admin adds, edits, or removes a
    // product — no refresh needed.
    const channel = supabase
      .channel("storefront_products")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "products" },
        (payload) => {
          const incoming = payload.new as Item;
          setProducts((prev) => (prev.some((p) => p.id === incoming.id) ? prev : [incoming, ...prev]));
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const updated = payload.new as Item;
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "products" },
        (payload) => {
          const removedId = (payload.old as { id: string }).id;
          setProducts((prev) => prev.filter((p) => p.id !== removedId));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Fetch user profile data from public.profiles table
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, address")
        .eq("id", user.id)
        .single();

      if (data && !error) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setAddress({ ...EMPTY_ADDRESS, ...(data.address ?? {}) });
      }
    }
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const currentUserId = user?.id;

    if (!currentUserId) {
      setMessages([]);
      return;
    }

    let isMounted = true;

    async function fetchMessages() {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender, content, created_at, read")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: true });

      if (isMounted && data && !error) {
        setMessages(data as ChatMessage[]);
        // Seed the badge with any admin messages the customer hasn't seen yet —
        // e.g. sent while they were logged out or on a different page.
        const alreadyUnread = (data as ChatMessage[]).filter(
          (m) => m.sender === "admin" && !m.read
        ).length;
        if (alreadyUnread > 0 && !chatOpen) {
          setUnreadCount(alreadyUnread);
        }
      }
      setLoadingMessages(false);
    }
    fetchMessages();

    const channel = supabase
      .channel(`messages-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `user_id=eq.${currentUserId}` },
        (payload) => {
          const incoming = payload.new as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));
          if (incoming.sender === "admin" && !chatOpen) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user, chatOpen]);

  // Keep the chat scrolled to the latest message, and clear the unread badge on open
  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
      chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: "smooth" });

      // Persist "read" so the badge doesn't come back on the next page load.
      const currentUserId = user?.id;
      if (currentUserId) {
        supabase
          .from("messages")
          .update({ read: true })
          .eq("user_id", currentUserId)
          .eq("sender", "admin")
          .eq("read", false)
          .then(({ error }) => {
            if (error) console.error("Failed to mark messages read:", error.message);
          });
      }
    }
  }, [chatOpen, messages]);

  const visibleItems = category === "All" ? products : products.filter((i) => i.category === category);
  const cartItems = products.filter((i) => cart.includes(i.id));
  // Only the items the customer has checked off get counted toward checkout —
  // everything else stays parked in the cart for later.
  const selectedCartItems = cartItems.filter((i) => selectedForCheckout.includes(i.id));
  const cartTotal = selectedCartItems.reduce((sum, i) => sum + i.price, 0);
  const checkoutTotal = checkoutItems.reduce((sum, i) => sum + i.price, 0);

  const displayName = fullName || user?.email?.split("@")[0] || "";

  function toggleCartItem(id: string) {
    setCart((prev) => {
      const alreadyInCart = prev.includes(id);
      // New items default to selected; removing an item also drops it from selection.
      setSelectedForCheckout((sel) =>
        alreadyInCart ? sel.filter((x) => x !== id) : [...sel, id]
      );
      return alreadyInCart ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }

  function withSize(item: Item): Item & { size?: string } {
    return selectedSizes[item.id] ? { ...item, size: selectedSizes[item.id] } : item;
  }

  // Finds other pieces that likely share the same brand/collab by comparing
  // significant words in the title (e.g. "New Era x Fear of God ESSENTIALS"
  // matches other titles containing "Fear" and "God"). Falls back to items in
  // the same category so the shelf always has something to suggest.
  const TITLE_STOPWORDS = new Set([
    "the", "and", "for", "with", "new", "of", "a", "an", "x", "by", "in", "on",
  ]);

  function getRelatedItems(item: Item, limit = 4): Item[] {
    const words = item.title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !TITLE_STOPWORDS.has(w));

    const scored = products
      .filter((p) => p.id !== item.id)
      .map((p) => {
        const pWords = new Set(p.title.toLowerCase().split(/[^a-z0-9]+/));
        const shared = words.filter((w) => pWords.has(w)).length;
        return { p, shared };
      })
      .filter((x) => x.shared > 0)
      .sort((a, b) => b.shared - a.shared)
      .map((x) => x.p);

    if (scored.length >= limit) return scored.slice(0, limit);

    const sameCategory = products.filter(
      (p) => p.id !== item.id && p.category === item.category && !scored.some((s) => s.id === p.id)
    );
    return [...scored, ...sameCategory].slice(0, limit);
  }

  function toggleSelectedForCheckout(id: string) {
    setSelectedForCheckout((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function openCheckout(items: Item[]) {
    setCheckoutItems(items);
    setCheckoutPhone(phone);
    setCheckoutAddress(address);
    setPaymentMethod(null);
    setCheckoutFormError("");
    setOrderPlaced(false);
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function closeCheckout() {
    if (placingOrder) return;
    setCheckoutOpen(false);
  }

  // Called the moment a purchase goes through (COD placed, or GCash/Bank checkout
  // initiated) so the shelf reflects reality straight away — this is what makes a
  // last-piece item (stock === 1) flip to "Sold Out" instead of staying listed.
  async function decrementStock(items: (Item & { size?: string })[]) {
    setProducts((prev) =>
      prev.map((p) => {
        const boughtQty = items.filter((i) => i.id === p.id).length;
        return boughtQty > 0 ? { ...p, stock: Math.max(0, p.stock - boughtQty) } : p;
      })
    );

    await Promise.all(
      items.map((item) =>
        supabase.from("products").update({ stock: Math.max(0, item.stock - 1) }).eq("id", item.id)
      )
    );
  }

  async function placeOrder() {
    if (!checkoutPhone.trim()) {
      setCheckoutFormError("Please enter a contact number.");
      return;
    }
    if (isAddressEmpty(checkoutAddress)) {
      setCheckoutFormError("Please enter your delivery address.");
      return;
    }
    if (!paymentMethod) {
      setCheckoutFormError("Please select a payment method.");
      return;
    }
    
    setCheckoutFormError("");
    setPlacingOrder(true);

    const deliveryFee = calculateDeliveryFee(checkoutAddress.city);

    if (paymentMethod === "gcash" || paymentMethod === "bank") {
      // Call PayMongo automated gateway API route
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: checkoutItems,
            deliveryFee,
            address: checkoutAddress,
            phone: checkoutPhone,
            customerEmail: user?.email,
          }),
        });
        const data = await res.json();
        if (data.checkoutUrl) {
          await decrementStock(checkoutItems);
          window.location.href = data.checkoutUrl; // Redirect to PayMongo GCash/Card page
          return;
        } else {
          throw new Error(data.error || "Something went wrong");
        }
      } catch (err: any) {
        setCheckoutFormError(err.message);
        setPlacingOrder(false);
      }
    } else {
      // Handle Cash on Delivery (COD) normally
      setTimeout(() => {
        const placedIds = checkoutItems.map((i) => i.id);
        const newOrders: Order[] = checkoutItems.map((item) => {
          const size = (item as Item & { size?: string }).size;
          return {
            id: `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
            itemName: size ? `${item.title} (Size ${size})` : item.title,
            brand: item.category,
            price: item.price,
            date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
            status: "placed",
            swatch: ["#2B3A2A", "#425443"],
          };
        });

        decrementStock(checkoutItems);
        setOrders((prev) => [...newOrders, ...prev]);
        setCart((prev) => prev.filter((id) => !placedIds.includes(id)));
        setSelectedForCheckout((prev) => prev.filter((id) => !placedIds.includes(id)));
        setPlacingOrder(false);
        setOrderPlaced(true);
        setPlacedOrderId(newOrders.map((o) => o.id).join(", "));
      }, 900);
    }
  }

  function confirmReceived(orderId: string) {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)));
  }

  async function saveContactDetails(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSavingContact(true);
    setContactError("");

    // Update the database columns in public.profiles table
    const { error } = await supabase
      .from("profiles")
      .update({
        phone: phone.trim(),
        address: {
          ...address,
          houseStreet: address.houseStreet.trim(),
          barangay: address.barangay.trim(),
          city: address.city.trim(),
          province: address.province.trim(),
          postalCode: address.postalCode.trim(),
        },
      })
      .eq("id", user.id);

    setSavingContact(false);
    if (error) {
      setContactError("Couldn't save your details — please try again.");
      return;
    }
    setEditingContact(false);
  }

  async function cancelEditContact() {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("phone, address")
      .eq("id", user.id)
      .single();

    if (data) {
      setPhone(data.phone ?? "");
      setAddress({ ...EMPTY_ADDRESS, ...(data.address ?? {}) });
    }
    setContactError("");
    setLocateError("");
    setEditingContact(false);
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocateError("Location isn't supported on this device.");
      return;
    }
    setLocating(true);
    setLocateError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const a = data?.address ?? {};
          setAddress((prev) => ({
            ...prev,
            houseStreet: [a.house_number, a.road].filter(Boolean).join(" ") || prev.houseStreet,
            barangay: a.suburb || a.village || a.neighbourhood || prev.barangay,
            city: a.city || a.town || a.municipality || prev.city,
            province: a.state || a.province || prev.province,
            postalCode: a.postcode || prev.postalCode,
            lat: latitude,
            lng: longitude,
          }));
        } catch {
          // Reverse geocoding failed — still keep the precise pin for the rider.
          setAddress((prev) => ({ ...prev, lat: latitude, lng: longitude }));
          setLocateError("Got your pin, but couldn't fill in the address text automatically — please check the fields below.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocateError("Couldn't get your location. Please allow location access, or enter your address manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function sendChatMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content || !user || sendingMessage) return;

    setSendingMessage(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ user_id: user.id, sender: "customer", content })
      .select("id, sender, content, created_at")
      .single();

    setSendingMessage(false);
    if (!error && data) {
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data as ChatMessage]));
      setChatInput("");
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function setOrderRating(orderId: string, rating: number) {
    setFeedback((prev) => ({
      ...prev,
      [orderId]: { rating, comment: prev[orderId]?.comment ?? "", submitted: false },
    }));
  }

  function setOrderComment(orderId: string, comment: string) {
    setFeedback((prev) => ({
      ...prev,
      [orderId]: { rating: prev[orderId]?.rating ?? 0, comment, submitted: false },
    }));
  }

  function submitFeedback(orderId: string) {
    setFeedback((prev) => ({
      ...prev,
      [orderId]: { ...prev[orderId], submitted: true },
    }));
  }

  return (
    <div className="romano-dash-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600&display=swap');
        .romano-dash-root {
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
          min-height: 100vh;
        }
        .romano-dash-root .font-display { font-family: 'Fraunces', serif; }
        .romano-dash-root .eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.2em;
          font-size: 0.68rem;
          font-weight: 600;
          color: var(--brass);
        }
        .romano-dash-root .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
          height: 44px;
          padding: 0 1.5rem;
          background: var(--verde);
          color: var(--stone-light);
          border: 1px solid var(--verde);
          font-size: 0.8rem;
          letter-spacing: 0.03em;
          font-weight: 600;
          border-radius: 2px;
          transition: background 0.2s ease, transform 0.15s ease, box-shadow 0.2s ease;
          cursor: pointer;
        }
        .romano-dash-root .btn-primary:hover {
          background: var(--verde-dark);
          transform: translateY(-1px);
          box-shadow: 0 10px 20px rgba(23,33,26,0.2);
        }
        .romano-dash-root .btn-primary:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        .romano-dash-root .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          white-space: nowrap;
          height: 40px;
          padding: 0 1.25rem;
          background: transparent;
          color: var(--verde);
          border: 1px solid rgba(43,58,42,0.3);
          font-size: 0.78rem;
          letter-spacing: 0.03em;
          font-weight: 600;
          border-radius: 2px;
          transition: background 0.2s ease;
          cursor: pointer;
        }
        .romano-dash-root .btn-secondary:hover { background: rgba(43,58,42,0.06); }
        .romano-dash-root .card {
          background: var(--stone-light);
          border: 1px solid rgba(28,24,21,0.08);
          border-radius: 4px;
        }
        .romano-dash-root .tab-link {
          padding: 0.5rem 0.15rem;
          font-size: 0.88rem;
          font-weight: 500;
          opacity: 0.55;
          border-bottom: 2px solid transparent;
          transition: opacity 0.2s ease, border-color 0.2s ease;
          white-space: nowrap;
        }
        .romano-dash-root .tab-link:hover { opacity: 0.85; }
        .romano-dash-root .tab-link.active {
          opacity: 1;
          color: var(--verde);
          border-color: var(--verde);
        }
        .romano-dash-root .chip {
          padding: 0.45rem 0.95rem;
          font-size: 0.78rem;
          font-weight: 500;
          border-radius: 999px;
          border: 1px solid rgba(28,24,21,0.15);
          opacity: 0.7;
          white-space: nowrap;
          transition: all 0.2s ease;
        }
        .romano-dash-root .chip:hover { opacity: 1; }
        .romano-dash-root .chip.active {
          background: var(--verde);
          border-color: var(--verde);
          color: var(--stone-light);
          opacity: 1;
        }
        .romano-dash-root .item-card { transition: transform 0.3s ease, box-shadow 0.3s ease; }
        .romano-dash-root .item-card:hover { transform: translateY(-3px); box-shadow: 0 16px 30px rgba(28,24,21,0.1); }

        .romano-dash-root .sold-out-ribbon {
          position: absolute;
          top: 14px;
          right: -34px;
          width: 150px;
          padding: 5px 0;
          background: var(--oxide);
          color: var(--stone-light);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-align: center;
          text-transform: uppercase;
          transform: rotate(35deg);
          box-shadow: 0 3px 8px rgba(28,24,21,0.25);
          pointer-events: none;
        }
        .romano-dash-root .quickview-related-sold {
          position: absolute;
          inset: 0;
          background: rgba(28,24,21,0.55);
          color: var(--stone-light);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-align: center;
          padding: 2px;
        }

        .romano-dash-root .size-chip {
          padding: 0.3rem 0.65rem;
          font-size: 0.72rem;
          font-weight: 600;
          border-radius: 6px;
          border: 1px solid rgba(28,24,21,0.18);
          background: transparent;
          opacity: 0.75;
          transition: all 0.15s ease;
        }
        .romano-dash-root .size-chip:hover { opacity: 1; }
        .romano-dash-root .size-chip.active {
          background: var(--verde);
          border-color: var(--verde);
          color: var(--stone-light);
          opacity: 1;
        }

        .romano-dash-root .quickview-overlay {
          position: fixed;
          inset: 0;
          background: rgba(28,24,21,0.55);
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .romano-dash-root .quickview-modal {
          position: relative;
          width: 100%;
          max-width: 820px;
          max-height: 88vh;
          background: var(--stone-light);
          border-radius: 14px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.28);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .romano-dash-root .quickview-close {
          position: absolute;
          top: 14px;
          right: 14px;
          z-index: 5;
          width: 34px;
          height: 34px;
          border-radius: 999px;
          background: var(--stone-light);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.75;
          box-shadow: 0 2px 8px rgba(28,24,21,0.15);
        }
        .romano-dash-root .quickview-close:hover { opacity: 1; }
        .romano-dash-root .quickview-scroll {
          overflow-y: auto;
          padding: 28px;
        }
        .romano-dash-root .quickview-top {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
        }
        @media (min-width: 640px) {
          .romano-dash-root .quickview-top { grid-template-columns: 1fr 1fr; }
        }
        .romano-dash-root .quickview-image {
          position: relative;
        }
        .romano-dash-root .quickview-gallery {
          display: flex;
          gap: 10px;
        }
        .romano-dash-root .quickview-thumbs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
          max-height: 420px;
        }
        .romano-dash-root .quickview-thumb {
          width: 52px;
          height: 52px;
          border-radius: 6px;
          overflow: hidden;
          border: 1.5px solid transparent;
          cursor: pointer;
          flex-shrink: 0;
          background: rgba(28,24,21,0.06);
          padding: 0;
        }
        .romano-dash-root .quickview-thumb.active {
          border-color: var(--verde);
        }
        .romano-dash-root .quickview-main-image {
          flex: 1;
          min-width: 0;
          position: relative;
          aspect-ratio: 4 / 5;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(28,24,21,0.06);
        }
        .romano-dash-root .quickview-info { display: flex; flex-direction: column; justify-content: center; }
        .romano-dash-root .quickview-details {
          margin: 0;
        }
        .romano-dash-root .quickview-details-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          padding: 8px 0;
          border-bottom: 1px solid rgba(28,24,21,0.08);
        }
        .romano-dash-root .quickview-details-row:last-child {
          border-bottom: none;
        }
        .romano-dash-root .quickview-details-row dt {
          font-size: 12.5px;
          color: rgba(28,24,21,0.5);
          font-weight: 500;
          white-space: nowrap;
        }
        .romano-dash-root .quickview-details-row dd {
          margin: 0;
          text-align: right;
          font-size: 13px;
          font-weight: 500;
          color: var(--ink);
        }

        .romano-dash-root .quickview-related {
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid rgba(28,24,21,0.08);
        }
        .romano-dash-root .quickview-related-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        .romano-dash-root .quickview-related-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          width: 112px;
          flex-shrink: 0;
          text-align: left;
          transition: opacity 0.15s ease;
        }
        .romano-dash-root .quickview-related-card:hover {
          opacity: 0.8;
        }
        .romano-dash-root .quickview-related-image {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 8px;
          overflow: hidden;
          background: rgba(28,24,21,0.06);
          border: 1px solid rgba(28,24,21,0.08);
          margin-bottom: 7px;
          transition: border-color 0.15s ease;
        }
        .romano-dash-root .quickview-related-card:hover .quickview-related-image {
          border-color: rgba(28,24,21,0.2);
        }
        .romano-dash-root .quickview-related-title {
          font-size: 11.5px;
          line-height: 1.35;
          color: var(--ink);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .romano-dash-root .quickview-related-price {
          font-size: 11.5px;
          font-weight: 600;
          margin-top: 2px;
          color: var(--ink);
        }

        .romano-dash-root a:focus-visible,
        .romano-dash-root button:focus-visible {
          outline: 2px solid var(--brass);
          outline-offset: 2px;
        }

        .romano-dash-root .cart-badge {
          position: absolute;
          top: -7px;
          right: -8px;
          background: var(--oxide);
          color: var(--stone-light);
          font-size: 10px;
          font-weight: 700;
          min-width: 16px;
          height: 16px;
          padding: 0 3px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .romano-dash-root .cart-overlay {
          position: fixed;
          inset: 0;
          background: rgba(28,24,21,0.45);
          z-index: 40;
        }
        .romano-dash-root .cart-panel {
          position: fixed;
          top: 0;
          right: 0;
          height: 100%;
          width: 100%;
          max-width: 400px;
          background: var(--stone-light);
          z-index: 50;
          box-shadow: -12px 0 30px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
        }

        .romano-dash-root .btn-icon { width: 44px; padding: 0; flex-shrink: 0; }
        .romano-dash-root .btn-icon-active {
          color: var(--oxide);
          border-color: rgba(138,59,42,0.3);
          background: rgba(138,59,42,0.06);
        }

        .romano-dash-root .checkout-overlay {
          position: fixed;
          inset: 0;
          background: rgba(28,24,21,0.55);
          z-index: 60;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .romano-dash-root .checkout-modal {
          background: var(--stone-light);
          width: 100%;
          max-width: 560px;
          max-height: calc(100vh - 40px);
          border-radius: 6px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.35);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .romano-dash-root .checkout-header {
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid rgba(28,24,21,0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .romano-dash-root .checkout-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }
        .romano-dash-root .checkout-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid rgba(28,24,21,0.08);
          flex-shrink: 0;
        }
        .romano-dash-root .checkout-item-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          padding: 0.55rem 0;
        }
        .romano-dash-root .payment-option {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          width: 100%;
          padding: 0.85rem 1rem;
          border: 1px solid rgba(28,24,21,0.12);
          border-radius: 4px;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
          background: var(--stone-light);
          text-align: left;
        }
        .romano-dash-root .payment-option:hover { border-color: rgba(43,58,42,0.35); }
        .romano-dash-root .payment-option.active {
          border-color: var(--verde);
          background: rgba(43,58,42,0.05);
        }
        .romano-dash-root .payment-option .radio-dot {
          width: 17px;
          height: 17px;
          border-radius: 999px;
          border: 2px solid rgba(28,24,21,0.25);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .romano-dash-root .payment-option.active .radio-dot { border-color: var(--verde); }
        .romano-dash-root .payment-option.active .radio-dot::after {
          content: '';
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--verde);
        }
        .romano-dash-root .payment-note {
          font-size: 0.78rem;
          line-height: 1.55;
          padding: 0.75rem 1rem;
          background: rgba(169,129,63,0.08);
          border: 1px solid rgba(169,129,63,0.2);
          border-radius: 4px;
          color: var(--ink);
          opacity: 0.85;
          margin-top: 0.65rem;
        }

        .romano-dash-root .step-row { display: flex; align-items: center; }
        .romano-dash-root .step-dot {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(28,24,21,0.15);
          background: var(--stone-light);
          flex-shrink: 0;
        }
        .romano-dash-root .step-dot.done {
          background: var(--verde);
          border-color: var(--verde);
          color: var(--stone-light);
        }
        .romano-dash-root .step-line {
          flex: 1;
          height: 2px;
          background: rgba(28,24,21,0.15);
          margin: 0 4px;
        }
        .romano-dash-root .step-line.done { background: var(--verde); }
        .romano-dash-root .step-label {
          font-size: 0.68rem;
          text-align: center;
          opacity: 0.6;
        }
        .romano-dash-root .step-label.done { opacity: 1; color: var(--verde); font-weight: 600; }

        .romano-dash-root .star-btn {
          background: none;
          border: none;
          padding: 2px;
          cursor: pointer;
          color: rgba(28,24,21,0.25);
          line-height: 0;
        }
        .romano-dash-root .star-btn.filled { color: var(--brass); }

        .romano-dash-root .signout-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          opacity: 0.65;
          transition: opacity 0.2s ease;
          cursor: pointer;
        }
        .romano-dash-root .signout-btn:hover { opacity: 1; color: var(--oxide); }
        .romano-dash-root .signout-btn:disabled { cursor: not-allowed; opacity: 0.4; }

        .romano-dash-root .chat-fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 999px;
          background: var(--verde);
          color: var(--stone-light);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 26px rgba(23,33,26,0.3);
          z-index: 45;
          cursor: pointer;
          transition: transform 0.15s ease, background 0.2s ease;
        }
        .romano-dash-root .chat-fab:hover { background: var(--verde-dark); transform: translateY(-2px); }
        .romano-dash-root .chat-fab .cart-badge { top: -4px; right: -4px; }
        .romano-dash-root .chat-unread-dot {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 13px;
          height: 13px;
          border-radius: 999px;
          background: #ef4444;
          border: 2px solid var(--verde);
        }

        .romano-dash-root .chat-panel {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 360px;
          max-width: calc(100vw - 32px);
          height: 520px;
          max-height: calc(100vh - 48px);
          background: var(--stone-light);
          border-radius: 8px;
          border: 1px solid rgba(28,24,21,0.1);
          box-shadow: 0 24px 60px rgba(0,0,0,0.22);
          z-index: 50;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .romano-dash-root .chat-header {
          background: var(--verde-dark);
          color: var(--stone-light);
          padding: 1rem 1.1rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          flex-shrink: 0;
        }
        .romano-dash-root .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .romano-dash-root .chat-bubble {
          max-width: 82%;
          padding: 0.55rem 0.8rem;
          border-radius: 12px;
          font-size: 0.84rem;
          line-height: 1.42;
        }
        .romano-dash-root .chat-bubble.customer {
          align-self: flex-end;
          background: var(--verde);
          color: var(--stone-light);
          border-bottom-right-radius: 3px;
        }
        .romano-dash-root .chat-bubble.admin {
          align-self: flex-start;
          background: rgba(28,24,21,0.06);
          color: var(--ink);
          border-bottom-left-radius: 3px;
        }
        .romano-dash-root .chat-timestamp {
          font-size: 0.62rem;
          opacity: 0.55;
          margin-top: 3px;
        }
        .romano-dash-root .chat-form {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem;
          border-top: 1px solid rgba(28,24,21,0.08);
          background: var(--stone-light);
        }
        .romano-dash-root .chat-input {
          flex: 1;
          height: 40px;
          padding: 0 0.85rem;
          font-size: 0.84rem;
          border-radius: 999px;
          border: 1px solid rgba(28,24,21,0.15);
          background: var(--stone);
          color: var(--ink);
        }
        .romano-dash-root .chat-input:focus {
          outline: none;
          border-color: var(--verde);
        }
        .romano-dash-root .chat-send {
          width: 38px;
          height: 38px;
          border-radius: 999px;
          background: var(--verde);
          color: var(--stone-light);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
          transition: background 0.2s ease, opacity 0.2s ease;
        }
        .romano-dash-root .chat-send:hover { background: var(--verde-dark); }
        .romano-dash-root .chat-send:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 480px) {
          .romano-dash-root .chat-panel {
            right: 16px;
            left: 16px;
            width: auto;
            bottom: 16px;
          }
          .romano-dash-root .chat-fab { bottom: 16px; right: 16px; }
        }
      `}</style>

      {/* ---------------- TOP BAR ---------------- */}
      <header className="border-b" style={{ borderColor: "rgba(28,24,21,0.1)", background: "rgba(246,241,231,0.7)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <svg width="26" height="26" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18.5" stroke="var(--verde)" strokeWidth="1.2" />
              <text x="20" y="27" textAnchor="middle" fontFamily="Fraunces, serif" fontSize="20" fill="var(--verde)">R</text>
            </svg>
            <span className="font-display text-sm tracking-[0.18em] uppercase hidden sm:inline">House of Romano</span>
          </Link>

          <nav className="flex items-center gap-6 overflow-x-auto">
            <button onClick={() => setTab("shop")} className={`tab-link ${tab === "shop" ? "active" : ""}`}>Shop</button>
            <button onClick={() => setTab("orders")} className={`tab-link ${tab === "orders" ? "active" : ""}`}>My Orders</button>
            <button onClick={() => setTab("account")} className={`tab-link ${tab === "account" ? "active" : ""}`}>Account</button>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <button
              aria-label={`Open cart, ${cart.length} item${cart.length === 1 ? "" : "s"}`}
              onClick={() => setCartOpen(true)}
              className="relative opacity-75 hover:opacity-100"
            >
              <ShoppingBag size={19} />
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>

            {user && (
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Sign out"
                className="signout-btn"
              >
                {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                <span className="hidden sm:inline">{signingOut ? "Signing Out…" : "Sign Out"}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
        {tab === "shop" && (
          <>
            <div className="mb-8">
              <p className="eyebrow mb-2">In Stock Now</p>
              <h1 className="font-display text-3xl md:text-4xl mb-2">What We Have Right Now</h1>
              <p className="opacity-70 max-w-lg">
                Every piece here is one of a kind — different brand, different find. Once it's sold, it's gone for good.
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`chip ${category === c ? "active" : ""}`}
                >
                  {c}
                </button>
              ))}
            </div>

            {loadingProducts ? (
              <div className="card p-12 text-center">
                <Loader2 size={20} className="animate-spin mx-auto opacity-50" />
              </div>
            ) : visibleItems.length === 0 ? (
              <div className="card p-12 text-center">
                <span className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(28,24,21,0.06)" }}>
                  <Shirt size={20} className="opacity-50" />
                </span>
                <p className="font-display text-lg mb-1.5">Nothing here right now</p>
                <p className="text-sm opacity-60">Check back soon — new pieces get added as they come in.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleItems.map((item) => {
                  const inCart = cart.includes(item.id);
                  const inStock = item.stock > 0;
                  // Caps are one-size-fits-all; every other category shows a size picker
                  // when the admin has set sizes for that product.
                  const hasSizes = item.category !== "Caps" && !!item.sizes && item.sizes.length > 0;
                  const selectedSize = selectedSizes[item.id];
                  const needsSize = hasSizes && !selectedSize;
                  return (
                    <div
                      key={item.id}
                      className="item-card card overflow-hidden cursor-pointer"
                      onClick={() => openQuickView(item)}
                    >
                      <div className="aspect-[4/5] relative overflow-hidden" style={{ background: "rgba(28,24,21,0.06)" }}>
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Shirt size={28} className="opacity-30" />
                          </div>
                        )}
                        {!inStock && <div className="sold-out-ribbon">Sold Out</div>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs uppercase tracking-widest opacity-55">{item.category}</p>
                          <span
                            className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              background: inStock ? "rgba(43,58,42,0.1)" : "rgba(138,59,42,0.1)",
                              color: inStock ? "var(--verde)" : "var(--oxide)",
                            }}
                          >
                            {inStock ? "In Stock" : "Sold Out"}
                          </span>
                        </div>
                        <h3 className="font-display text-base mb-1">{item.title}</h3>
                        <p className="font-display text-lg mb-3">₱{item.price.toLocaleString()}</p>

                        {hasSizes && inStock && (
                          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                            <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1.5">Size</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.sizes!.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => pickSize(item.id, s)}
                                  aria-pressed={selectedSize === s}
                                  className={`size-chip ${selectedSize === s ? "active" : ""}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {!inStock && !inCart && (
                          <button disabled className="btn-primary w-full opacity-40 cursor-not-allowed">
                            Sold Out
                          </button>
                        )}

                        {!inStock && inCart && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCartItem(item.id); }}
                            className="btn-secondary w-full"
                            style={{ color: "var(--oxide)", borderColor: "rgba(138,59,42,0.3)" }}
                          >
                            <Trash2 size={14} /> Remove from Cart
                          </button>
                        )}

                        {inStock && (
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); if (!needsSize) openCheckout([withSize(item)]); }}
                                disabled={needsSize}
                                className={`btn-primary flex-1 ${needsSize ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                <Zap size={13} /> Buy Now
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); if (!needsSize) toggleCartItem(item.id); }}
                                disabled={needsSize && !inCart}
                                aria-label={inCart ? `Remove ${item.title} from cart` : `Add ${item.title} to cart`}
                                className={`btn-secondary btn-icon ${inCart ? "btn-icon-active" : ""} ${needsSize && !inCart ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                {inCart ? <Trash2 size={16} /> : <ShoppingBag size={16} />}
                              </button>
                            </div>
                            {needsSize && (
                              <p className="text-[11px] mt-1.5" style={{ color: "var(--oxide)" }}>
                                Please select a size
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {tab === "orders" && (
          <div>
            <p className="eyebrow mb-2">My Orders</p>
            <h1 className="font-display text-3xl mb-2">Your Orders</h1>
            <p className="opacity-70 max-w-lg mb-8">
              Track each order from the moment it ships to the moment it lands in your hands.
            </p>

            {!user ? (
              <div className="card p-10 text-center">
                <p className="font-display text-lg mb-1.5">Sign in to see your orders</p>
                <p className="text-sm opacity-60 mb-6">Your order history and delivery status will show up here.</p>
                <Link href="/" className="btn-primary">Sign In</Link>
              </div>
            ) : orders.length === 0 ? (
              <div className="card p-10 text-center">
                <span className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(28,24,21,0.06)" }}>
                  <Package size={20} className="opacity-50" />
                </span>
                <p className="font-display text-lg mb-1.5">No orders yet</p>
                <p className="text-sm opacity-60 mb-6">When you order something, you'll see it here.</p>
                <button onClick={() => setTab("shop")} className="btn-primary">
                  Start Shopping <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {orders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    feedback={feedback[order.id]}
                    onConfirmReceived={() => confirmReceived(order.id)}
                    onSetRating={(r) => setOrderRating(order.id, r)}
                    onSetComment={(c) => setOrderComment(order.id, c)}
                    onSubmitFeedback={() => submitFeedback(order.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "account" && (
          <div className="max-w-lg">
            <p className="eyebrow mb-2">Account</p>
            <h1 className="font-display text-3xl mb-8">Your Details</h1>

            {!user ? (
              <div className="card p-10 text-center">
                <p className="font-display text-lg mb-1.5">Sign in to view your account</p>
                <p className="text-sm opacity-60 mb-6">Manage your details once you're signed in.</p>
                <Link href="/" className="btn-primary">Sign In</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Personal info — read-only, tied to the signed-in account */}
                <div className="card p-6">
                  <p className="text-xs uppercase tracking-widest opacity-50 mb-3">Personal Info</p>
                  <dl className="divide-y" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
                    <Row icon={UserCircle} label="Name" value={displayName || "Not set"} />
                    <Row icon={Mail} label="Email" value={user.email ?? "—"} />
                  </dl>
                </div>

                {/* Delivery details — phone + structured address, like a Lazada/Shopee address card */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs uppercase tracking-widest opacity-50">Delivery Details</p>
                    {!editingContact && (
                      <button
                        onClick={() => setEditingContact(true)}
                        className="text-xs font-semibold inline-flex items-center gap-1 hover:opacity-70"
                        style={{ color: "var(--verde)" }}
                      >
                        <Pencil size={12} /> {phone || !isAddressEmpty(address) ? "Edit" : "Add"}
                      </button>
                    )}
                  </div>

                  {!editingContact ? (
                    isAddressEmpty(address) && !phone ? (
                      <div className="text-center py-8">
                        <span className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(28,24,21,0.06)" }}>
                          <MapPin size={18} className="opacity-50" />
                        </span>
                        <p className="text-sm mb-1">No delivery details yet</p>
                        <p className="text-xs opacity-60 mb-4">Add your number and address so riders can reach you.</p>
                        <button onClick={() => setEditingContact(true)} className="btn-primary">
                          <Pencil size={13} /> Add Contact & Address
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <div className="flex items-start gap-3 py-3 border-b" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
                          <Phone size={16} className="opacity-45 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs uppercase tracking-widest opacity-50 mb-0.5">Contact No.</p>
                            <p className="text-sm">{phone || "Not set"}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 py-3">
                          <MapPin size={16} className="opacity-45 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs uppercase tracking-widest opacity-50">Address</p>
                              {!isAddressEmpty(address) && (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                                  style={{ background: "rgba(43,58,42,0.08)", color: "var(--verde)" }}
                                >
                                  {address.label === "Work" ? <Briefcase size={9} /> : <Home size={9} />}
                                  {address.label}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{isAddressEmpty(address) ? "Not set" : formatAddress(address)}</p>
                            {address.lat != null && address.lng != null && (
                              <a
                                href={`https://www.google.com/maps?q=${address.lat},${address.lng}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-semibold inline-flex items-center gap-1 mt-1.5 hover:opacity-70"
                                style={{ color: "var(--brass)" }}
                              >
                                <LocateFixed size={11} /> View pinned location on map
                              </a>
                            )}
                          </div>
                        </div>
                        <p className="text-xs opacity-50 mt-3">
                          Your contact number is what our rider calls if they need directions on delivery day.
                        </p>
                      </div>
                    )
                  ) : (
                    <form onSubmit={saveContactDetails} className="space-y-5 pt-2">
                      <div>
                        <label htmlFor="phone" className="text-xs uppercase tracking-widest opacity-50 block mb-1.5">
                          Contact Number
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 0917 123 4567"
                          className="w-full text-sm p-3 rounded"
                          style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                        />
                        <p className="text-xs opacity-50 mt-1.5">This is the number the rider will call for delivery.</p>
                      </div>

                      <div className="pt-1 border-t" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
                        <div className="flex items-center justify-between mt-4 mb-1.5">
                          <label className="text-xs uppercase tracking-widest opacity-50">Delivery Address</label>
                          <button
                            type="button"
                            onClick={useCurrentLocation}
                            disabled={locating}
                            className="text-xs font-semibold inline-flex items-center gap-1 hover:opacity-70 disabled:opacity-50"
                            style={{ color: "var(--verde)" }}
                          >
                            {locating ? <Loader2 size={12} className="animate-spin" /> : <LocateFixed size={12} />}
                            {locating ? "Locating…" : "Use my current location"}
                          </button>
                        </div>
                        {locateError && (
                          <p className="text-xs mb-2" style={{ color: "var(--oxide)" }}>{locateError}</p>
                        )}
                        {address.lat != null && address.lng != null && (
                          <p className="text-xs mb-2 flex items-center gap-1" style={{ color: "var(--verde)" }}>
                            <CheckCircle2 size={12} /> Pin captured — this helps the rider find you exactly.
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="sm:col-span-2">
                            <input
                              id="houseStreet"
                              required
                              value={address.houseStreet}
                              onChange={(e) => setAddress((p) => ({ ...p, houseStreet: e.target.value }))}
                              placeholder="House/Unit No. & Street"
                              className="w-full text-sm p-3 rounded"
                              style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                            />
                          </div>
                          <input
                            id="barangay"
                            required
                            value={address.barangay}
                            onChange={(e) => setAddress((p) => ({ ...p, barangay: e.target.value }))}
                            placeholder="Barangay"
                            className="w-full text-sm p-3 rounded"
                            style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                          />
                          <Combobox
                            id="city"
                            required
                            value={address.city}
                            onChange={(v) => setAddress((p) => ({ ...p, city: v }))}
                            options={CITY_OPTIONS}
                            placeholder="City / Municipality"
                          />
                          <Combobox
                            id="province"
                            required
                            value={address.province}
                            onChange={(v) => setAddress((p) => ({ ...p, province: v }))}
                            options={PH_PROVINCES}
                            placeholder="Province"
                          />
                          <input
                            id="postalCode"
                            required
                            inputMode="numeric"
                            value={address.postalCode}
                            onChange={(e) => setAddress((p) => ({ ...p, postalCode: e.target.value }))}
                            placeholder="Postal Code"
                            className="w-full text-sm p-3 rounded"
                            style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                          />
                        </div>

                        <div className="mt-3">
                          <label className="text-xs uppercase tracking-widest opacity-50 block mb-1.5">Label As</label>
                          <div className="flex gap-2">
                            {(["Home", "Work", "Other"] as AddressLabel[]).map((l) => (
                              <button
                                key={l}
                                type="button"
                                onClick={() => setAddress((p) => ({ ...p, label: l }))}
                                className={`chip ${address.label === l ? "active" : ""}`}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {contactError && (
                        <p className="text-xs" style={{ color: "var(--oxide)" }}>{contactError}</p>
                      )}

                      <div className="flex items-center gap-3">
                        <button type="submit" disabled={savingContact} className="btn-primary">
                          {savingContact ? "Saving…" : "Save Details"}
                        </button>
                        <button type="button" onClick={cancelEditContact} className="btn-secondary">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ---------------- CART DRAWER ---------------- */}
      {cartOpen && (
        <>
          <div className="cart-overlay" onClick={() => setCartOpen(false)} />
          <div className="cart-panel">
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
              <h2 className="font-display text-xl">Your Cart</h2>
              <button aria-label="Close cart" onClick={() => setCartOpen(false)} className="opacity-60 hover:opacity-100">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {cartItems.length === 0 ? (
                <div className="text-center py-16">
                  <span className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(28,24,21,0.06)" }}>
                    <ShoppingBag size={20} className="opacity-50" />
                  </span>
                  <p className="font-display text-lg mb-1.5">Your cart is empty</p>
                  <p className="text-sm opacity-60 mb-6">Add a piece you like and it'll show up here.</p>
                  <button onClick={() => { setCartOpen(false); setTab("shop"); }} className="btn-secondary">
                    Browse the Shop
                  </button>
                </div>
              ) : (
                <ul className="space-y-4">
                  {cartItems.map((item) => {
                    const isSelected = selectedForCheckout.includes(item.id);
                    return (
                      <li key={item.id} className="flex gap-3">
                        <button
                          aria-label={isSelected ? `Deselect ${item.title}` : `Select ${item.title} for checkout`}
                          onClick={() => toggleSelectedForCheckout(item.id)}
                          className="w-5 h-5 rounded border shrink-0 self-start mt-1 flex items-center justify-center"
                          style={{
                            borderColor: isSelected ? "var(--verde)" : "rgba(28,24,21,0.25)",
                            background: isSelected ? "var(--verde)" : "transparent",
                            color: "var(--stone)",
                          }}
                        >
                          {isSelected && <CheckCircle2 size={13} />}
                        </button>
                        <div className="w-16 h-20 rounded shrink-0 overflow-hidden" style={{ background: "rgba(28,24,21,0.06)" }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shirt size={16} className="opacity-30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-widest opacity-55">
                            {item.category}
                            {selectedSizes[item.id] ? ` · Size ${selectedSizes[item.id]}` : ""}
                          </p>
                          <p className="font-display text-sm mb-1.5 truncate">{item.title}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">₱{item.price.toLocaleString()}</span>
                            <button
                              aria-label={`Remove ${item.title} from cart`}
                              onClick={() => toggleCartItem(item.id)}
                              className="opacity-50 hover:opacity-90"
                              style={{ color: "var(--oxide)" }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="px-6 py-5 border-t" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm opacity-70">
                    Total ({selectedCartItems.length} {selectedCartItems.length === 1 ? "item" : "items"})
                  </span>
                  <span className="font-display text-xl">₱{cartTotal.toLocaleString()}</span>
                </div>
                {selectedCartItems.length === 0 && (
                  <p className="text-xs mb-3" style={{ color: "var(--oxide)" }}>
                    Select at least one item above to check out.
                  </p>
                )}
                {selectedCartItems.length > 0 && <div className="mb-3" />}
                {selectedCartItems.length === 0 ? (
                  <button disabled className="btn-primary w-full opacity-40 cursor-not-allowed">
                    Proceed to Checkout <ArrowRight size={15} />
                  </button>
                ) : (
                  <button onClick={() => openCheckout(selectedCartItems.map(withSize))} className="btn-primary w-full">
                    Proceed to Checkout <ArrowRight size={15} />
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ---------------- CHECKOUT MODAL ---------------- */}
      {checkoutOpen && (
        <div className="checkout-overlay" onClick={closeCheckout}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="checkout-header">
              <h2 className="font-display text-xl">{orderPlaced ? "Order Confirmed" : "Checkout"}</h2>
              <button aria-label="Close checkout" onClick={closeCheckout} className="opacity-60 hover:opacity-100">
                <X size={20} />
              </button>
            </div>

            {orderPlaced ? (
              <div className="checkout-body text-center py-8">
                <span
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: "rgba(43,58,42,0.1)", color: "var(--verde)" }}
                >
                  <CheckCircle2 size={26} />
                </span>
                <p className="font-display text-xl mb-2">Thank you — your order is in!</p>
                <p className="text-sm opacity-70 max-w-sm mx-auto mb-1">
                  We'll reach out at {checkoutPhone} to confirm your order and delivery details.
                </p>
                <p className="text-xs opacity-50 mb-8">Reference: {placedOrderId}</p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setCheckoutOpen(false);
                      setTab("orders");
                    }}
                    className="btn-primary"
                  >
                    View My Orders
                  </button>
                  <button onClick={closeCheckout} className="btn-secondary">
                    Continue Shopping
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="checkout-body">
                  <p className="text-xs uppercase tracking-widest opacity-50 mb-2">
                    {checkoutItems.length} {checkoutItems.length === 1 ? "Item" : "Items"}
                  </p>
                  <div className="mb-5 pb-5 border-b" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
                    {checkoutItems.map((item) => (
                      <div key={item.id} className="checkout-item-row">
                        <div className="w-14 h-16 rounded shrink-0 overflow-hidden" style={{ background: "rgba(28,24,21,0.06)" }}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shirt size={16} className="opacity-30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs uppercase tracking-widest opacity-55">
                            {item.category}
                            {(item as Item & { size?: string }).size ? ` · Size ${(item as Item & { size?: string }).size}` : ""}
                          </p>
                          <p className="font-display text-sm truncate">{item.title}</p>
                        </div>
                        <span className="text-sm font-medium shrink-0">₱{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-5">
                    <label htmlFor="checkoutPhone" className="text-xs uppercase tracking-widest opacity-50 block mb-1.5">
                      Contact Number
                    </label>
                    <input
                      id="checkoutPhone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="e.g. 0917 123 4567"
                      className="w-full text-sm p-3 rounded"
                      style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                    />
                    <p className="text-xs opacity-50 mt-1.5">This is the number our rider will call for delivery.</p>
                  </div>

                  <div className="mb-5">
                    <label className="text-xs uppercase tracking-widest opacity-50 block mb-1.5">Delivery Address</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          value={checkoutAddress.houseStreet}
                          onChange={(e) => setCheckoutAddress((p) => ({ ...p, houseStreet: e.target.value }))}
                          placeholder="House/Unit No. & Street"
                          className="w-full text-sm p-3 rounded"
                          style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                        />
                      </div>
                      <input
                        value={checkoutAddress.barangay}
                        onChange={(e) => setCheckoutAddress((p) => ({ ...p, barangay: e.target.value }))}
                        placeholder="Barangay"
                        className="w-full text-sm p-3 rounded"
                        style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                      />
                      <Combobox
                        value={checkoutAddress.city}
                        onChange={(v) => setCheckoutAddress((p) => ({ ...p, city: v }))}
                        options={CITY_OPTIONS}
                        placeholder="City / Municipality"
                      />
                      <Combobox
                        value={checkoutAddress.province}
                        onChange={(v) => setCheckoutAddress((p) => ({ ...p, province: v }))}
                        options={PH_PROVINCES}
                        placeholder="Province"
                      />
                      <input
                        value={checkoutAddress.postalCode}
                        onChange={(e) => setCheckoutAddress((p) => ({ ...p, postalCode: e.target.value }))}
                        placeholder="Postal Code"
                        inputMode="numeric"
                        className="w-full text-sm p-3 rounded"
                        style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-widest opacity-50 block mb-2">Payment Method</label>
                    <div className="space-y-2">
                      {PAYMENT_METHODS.map((pm) => {
                        const Icon = pm.icon;
                        const active = paymentMethod === pm.id;
                        return (
                          <button
                            type="button"
                            key={pm.id}
                            onClick={() => setPaymentMethod(pm.id)}
                            className={`payment-option ${active ? "active" : ""}`}
                          >
                            <span className="radio-dot" />
                            <Icon size={18} className="opacity-70 shrink-0" style={{ color: active ? "var(--verde)" : undefined }} />
                            <span className="flex-1">
                              <span className="block text-sm font-medium">{pm.label}</span>
                              <span className="block text-xs opacity-60">{pm.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {paymentMethod && <p className="payment-note">{paymentInstructions(paymentMethod, checkoutTotal)}</p>}
                  </div>

                  {checkoutFormError && (
                    <p className="text-xs mt-4" style={{ color: "var(--oxide)" }}>
                      {checkoutFormError}
                    </p>
                  )}
                </div>

                <div className="checkout-footer">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm opacity-70">
                      Total ({checkoutItems.length} {checkoutItems.length === 1 ? "item" : "items"})
                    </span>
                    <span className="font-display text-xl">₱{checkoutTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={placeOrder} disabled={placingOrder} className="btn-primary w-full">
                    {placingOrder ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Placing Order…
                      </>
                    ) : (
                      <>
                        Place Order <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ---------------- QUICK VIEW MODAL ---------------- */}
      {quickViewItem && (
        <div className="quickview-overlay" onClick={closeQuickView}>
          <div className="quickview-modal" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Close" onClick={closeQuickView} className="quickview-close">
              <X size={18} />
            </button>

            <div className="quickview-scroll">
              <div className="quickview-top">
                <div className="quickview-image">
                  {(() => {
                    const gallery = quickViewItem.image_urls && quickViewItem.image_urls.length > 0
                      ? quickViewItem.image_urls
                      : (quickViewItem.image_url ? [quickViewItem.image_url] : []);
                    const activeSrc = gallery[quickViewImageIndex] ?? gallery[0];

                    return (
                      <div className="quickview-gallery">
                        {gallery.length > 1 && (
                          <div className="quickview-thumbs">
                            {gallery.map((src, i) => (
                              <button
                                key={src + i}
                                type="button"
                                onClick={() => setQuickViewImageIndex(i)}
                                aria-label={`View image ${i + 1} of ${quickViewItem.title}`}
                                aria-current={i === quickViewImageIndex}
                                className={`quickview-thumb ${i === quickViewImageIndex ? "active" : ""}`}
                              >
                                <img src={src} alt="" className="w-full h-full object-cover" />
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="quickview-main-image">
                          {activeSrc ? (
                            <img src={activeSrc} alt={quickViewItem.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Shirt size={32} className="opacity-30" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                  {quickViewItem.stock <= 0 && <div className="sold-out-ribbon">Sold Out</div>}
                </div>

                <div className="quickview-info">
                  <p className="text-xs uppercase tracking-widest opacity-55 mb-1.5">{quickViewItem.category}</p>
                  <h2 className="font-display text-2xl mb-2">{quickViewItem.title}</h2>
                  <p className="font-display text-xl mb-3">₱{quickViewItem.price.toLocaleString()}</p>
                  <span
                    className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-4"
                    style={{
                      background: quickViewItem.stock > 0 ? "rgba(43,58,42,0.1)" : "rgba(138,59,42,0.1)",
                      color: quickViewItem.stock > 0 ? "var(--verde)" : "var(--oxide)",
                    }}
                  >
                    {quickViewItem.stock > 0 ? "In Stock" : "Sold Out"}
                  </span>

                  {(quickViewItem.brand || quickViewItem.style || quickViewItem.color || quickViewItem.condition || (quickViewItem.sizes && quickViewItem.sizes.length > 0)) && (
                    <div className="mb-5">
                      <p className="text-[10px] uppercase tracking-widest opacity-50 mb-2">Details</p>
                      <dl className="quickview-details">
                        {quickViewItem.brand && (
                          <div className="quickview-details-row">
                            <dt>Brand</dt>
                            <dd>{quickViewItem.brand}</dd>
                          </div>
                        )}
                        {quickViewItem.style && (
                          <div className="quickview-details-row">
                            <dt>Style</dt>
                            <dd>{quickViewItem.style}</dd>
                          </div>
                        )}
                        {quickViewItem.color && (
                          <div className="quickview-details-row">
                            <dt>Color</dt>
                            <dd>{quickViewItem.color}</dd>
                          </div>
                        )}
                        {quickViewItem.sizes && quickViewItem.sizes.length > 0 && (
                          <div className="quickview-details-row">
                            <dt>Size</dt>
                            <dd>{quickViewItem.sizes.join(", ")}</dd>
                          </div>
                        )}
                        {quickViewItem.condition && (
                          <div className="quickview-details-row">
                            <dt>Condition</dt>
                            <dd>{quickViewItem.condition}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}

                  {(() => {
                    const item = quickViewItem;
                    const inCart = cart.includes(item.id);
                    const inStock = item.stock > 0;
                    const hasSizes = item.category !== "Caps" && !!item.sizes && item.sizes.length > 0;
                    const selectedSize = selectedSizes[item.id];
                    const needsSize = hasSizes && !selectedSize;

                    return (
                      <>
                        {hasSizes && inStock && (
                          <div className="mb-5">
                            <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1.5">Size</p>
                            <div className="flex flex-wrap gap-1.5">
                              {item.sizes!.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => pickSize(item.id, s)}
                                  aria-pressed={selectedSize === s}
                                  className={`size-chip ${selectedSize === s ? "active" : ""}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {!inStock && !inCart && (
                          <button disabled className="btn-primary w-full opacity-40 cursor-not-allowed">
                            Sold Out
                          </button>
                        )}

                        {!inStock && inCart && (
                          <button
                            onClick={() => toggleCartItem(item.id)}
                            className="btn-secondary w-full"
                            style={{ color: "var(--oxide)", borderColor: "rgba(138,59,42,0.3)" }}
                          >
                            <Trash2 size={14} /> Remove from Cart
                          </button>
                        )}

                        {inStock && (
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  if (needsSize) return;
                                  closeQuickView();
                                  openCheckout([withSize(item)]);
                                }}
                                disabled={needsSize}
                                className={`btn-primary flex-1 ${needsSize ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                <Zap size={13} /> Buy Now
                              </button>
                              <button
                                onClick={() => !needsSize && toggleCartItem(item.id)}
                                disabled={needsSize && !inCart}
                                aria-label={inCart ? `Remove ${item.title} from cart` : `Add ${item.title} to cart`}
                                className={`btn-secondary btn-icon ${inCart ? "btn-icon-active" : ""} ${needsSize && !inCart ? "opacity-40 cursor-not-allowed" : ""}`}
                              >
                                {inCart ? <Trash2 size={16} /> : <ShoppingBag size={16} />}
                              </button>
                            </div>
                            {needsSize && (
                              <p className="text-[11px] mt-1.5" style={{ color: "var(--oxide)" }}>
                                Please select a size
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {(() => {
                const related = getRelatedItems(quickViewItem);
                if (related.length === 0) return null;
                return (
                  <div className="quickview-related">
                    <p className="text-xs uppercase tracking-widest opacity-50 mb-3">You Might Also Like</p>
                    <div className="quickview-related-grid">
                      {related.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => { setQuickViewItem(r); setQuickViewImageIndex(0); }}
                          className="quickview-related-card"
                          title={`${r.title} — ₱${r.price.toLocaleString()}`}
                          aria-label={`View ${r.title}, ₱${r.price.toLocaleString()}`}
                        >
                          <div className="quickview-related-image">
                            {r.image_url ? (
                              <img src={r.image_url} alt={r.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Shirt size={18} className="opacity-30" />
                              </div>
                            )}
                            {r.stock <= 0 && <div className="quickview-related-sold">Sold</div>}
                          </div>
                          <p className="quickview-related-title">{r.title}</p>
                          <p className="quickview-related-price">₱{r.price.toLocaleString()}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}


      {user && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          aria-label={`Chat with us${unreadCount > 0 ? `, ${unreadCount} new message${unreadCount === 1 ? "" : "s"}` : ""}`}
          className="chat-fab"
        >
          <MessageCircle size={22} />
          {unreadCount > 0 && <span className="chat-unread-dot" />}
        </button>
      )}

      {user && chatOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(246,241,231,0.15)" }}>
                <ShieldCheck size={16} />
              </span>
              <div>
                <p className="font-display text-sm leading-tight">House of Romano Support</p>
                <p className="text-[11px] opacity-70 leading-tight">Ask about sizing, measurements, or condition</p>
              </div>
            </div>
            <button aria-label="Close chat" onClick={() => setChatOpen(false)} className="opacity-75 hover:opacity-100">
              <X size={18} />
            </button>
          </div>

          <div ref={chatScrollRef} className="chat-messages">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={18} className="animate-spin opacity-50" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-sm opacity-60 mb-1">No messages yet</p>
                <p className="text-xs opacity-50">
                  Have a question about a piece — sizing, exact measurements, or condition? Ask us here before you buy.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.sender}`}>
                  <p>{m.content}</p>
                  <p className="chat-timestamp">{formatChatTime(m.created_at)}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={sendChatMessage} className="chat-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your question…"
              className="chat-input"
              maxLength={1000}
            />
            <button type="submit" disabled={!chatInput.trim() || sendingMessage} className="chat-send" aria-label="Send message">
              {sendingMessage ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// A text input that also offers a filtered, clickable dropdown of matching options —
// the person can either type freely or pick a suggestion. Falls back to plain typing
// when `options` is empty or nothing matches, so it's safe to reuse everywhere.
function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder,
  required,
  inputMode,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  inputMode?: "text" | "numeric";
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  const query = value.trim().toLowerCase();
  const filtered = (query ? options.filter((o) => o.toLowerCase().includes(query)) : options).slice(0, 30);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectOption(opt: string) {
    onChange(opt);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        id={id}
        required={required}
        inputMode={inputMode}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || filtered.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, filtered.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && filtered[highlight]) {
            e.preventDefault();
            selectOption(filtered[highlight]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className="w-full text-sm p-3 rounded"
        style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
      />
      {open && filtered.length > 0 && (
        <div
          className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded shadow-lg"
          style={{ background: "#FAF8F3", border: "1px solid rgba(28,24,21,0.14)" }}
        >
          {filtered.map((opt, i) => (
            <button
              type="button"
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
              }}
              onMouseEnter={() => setHighlight(i)}
              className="w-full text-left text-sm px-3 py-2"
              style={{ background: i === highlight ? "rgba(28,24,21,0.07)" : "transparent" }}
            >
              {opt}
            </button>
          ))}
         </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof UserCircle; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3.5">
      <Icon size={16} className="opacity-45 shrink-0" />
      <span className="text-xs uppercase tracking-widest opacity-50 w-24 shrink-0">{label}</span>
      <span className="text-sm truncate">{value}</span>
    </div>
  );
}

function OrderCard({
  order,
  feedback,
  onConfirmReceived,
  onSetRating,
  onSetComment,
  onSubmitFeedback,
}: {
  order: Order;
  feedback?: Feedback;
  onConfirmReceived: () => void;
  onSetRating: (rating: number) => void;
  onSetComment: (comment: string) => void;
  onSubmitFeedback: () => void;
}) {
  const current = stepIndex(order.status);
  const isCompleted = order.status === "completed";

  return (
    <div className="card p-6">
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-14 h-16 rounded shrink-0"
          style={{ background: `linear-gradient(150deg, ${order.swatch[0]}, ${order.swatch[1]})` }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs uppercase tracking-widest opacity-55">{order.brand}</p>
          <h3 className="font-display text-lg mb-0.5 truncate">{order.itemName}</h3>
          <p className="text-xs opacity-60">Order {order.id} · Placed {order.date}</p>
        </div>
        <span className="font-display text-lg shrink-0">₱{order.price.toLocaleString()}</span>
      </div>

      <div className="step-row mb-1.5">
        {TRACKING_STEPS.map((label, i) => (
          <React.Fragment key={label}>
            <div className={`step-dot ${i <= current ? "done" : ""}`}>
              {i < current || (i === current && isCompleted) ? <CheckCircle2 size={13} /> : null}
            </div>
            {i < TRACKING_STEPS.length - 1 && <div className={`step-line ${i < current ? "done" : ""}`} />}
          </React.Fragment>
        ))}
      </div>
      <div className="flex mb-6">
        {TRACKING_STEPS.map((label, i) => (
          <span key={label} className={`step-label ${i <= current ? "done" : ""}`} style={{ width: i === 0 || i === TRACKING_STEPS.length - 1 ? "44px" : "1fr", flex: i === 0 || i === TRACKING_STEPS.length - 1 ? "0 0 60px" : 1 }}>
            {label}
          </span>
        ))}
      </div>

      {order.status === "out_for_delivery" && (
        <p className="text-sm flex items-center gap-2 opacity-70">
          <Truck size={15} /> On its way — it should arrive soon.
        </p>
      )}

      {order.status === "delivered" && (
        <div className="pt-4 border-t flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
          <p className="text-sm opacity-70">Got your order? Let us know so you can leave a review.</p>
          <button onClick={onConfirmReceived} className="btn-primary">
            Confirm Received
          </button>
        </div>
      )}

      {isCompleted && (
        <div className="pt-4 border-t" style={{ borderColor: "rgba(28,24,21,0.08)" }}>
          {feedback?.submitted ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--verde)" }}>
              <CheckCircle2 size={16} />
              Thanks for your feedback!
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium mb-2">How was it?</p>
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                    onClick={() => onSetRating(n)}
                    className={`star-btn ${(feedback?.rating ?? 0) >= n ? "filled" : ""}`}
                  >
                    <Star size={20} fill={(feedback?.rating ?? 0) >= n ? "currentColor" : "none"} />
                  </button>
                ))}
              </div>
              <textarea
                value={feedback?.comment ?? ""}
                onChange={(e) => onSetComment(e.target.value)}
                placeholder="Tell us what you thought (optional)"
                rows={2}
                className="w-full text-sm p-3 rounded mb-3"
                style={{ background: "var(--stone)", border: "1px solid rgba(28,24,21,0.12)" }}
              />
              <button
                onClick={onSubmitFeedback}
                disabled={!feedback?.rating}
                className="btn-primary"
              >
                Submit Review
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageInner />
    </Suspense>
  );
}