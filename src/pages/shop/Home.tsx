import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Flame,
  FolderTree,
  MapPin,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { ItemCard } from "@/components/shop/ItemCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useSeo } from "@/hooks/useSeo";
import { useSettings } from "@/hooks/useSettings";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { ICONS } from "@/components/admin/IconPicker";
import type { Category, Item } from "@/lib/types";

const DEFAULT_ICON = "FolderTree";
const DEFAULT_COLOR = "#1e5b3a";

const PERKS = [
  {
    icon: Truck,
    title: "Delivered to your pin",
    text: "Drop a map pin at checkout and we bring it to your door.",
  },
  {
    icon: ShieldCheck,
    title: "Live prices and stock",
    text: "What you see is what is on the shelf right now.",
  },
  {
    icon: CheckCircle2,
    title: "Pay when confirmed",
    text: "No card needed. The shop confirms your order, then you pay.",
  },
];

export function Home() {
  const { settings } = useSettings();
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const drag = useDragScroll(categoryScrollRef);
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>(
    {},
  );
  const [loading, setLoading] = useState(isSupabaseConfigured);

  const iconMap = Object.fromEntries(
    ICONS.map(({ name, Component }) => [name, Component]),
  );

  useSeo({
    title: `${settings.shop_name} — Online Shopping`,
    description: `Shop everyday essentials at ${settings.shop_name}. Browse categories, see live prices and stock, and check out quickly.`,
    path: "/",
  });

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [categoriesResult, itemsResult, countsResult] = await Promise.all([
      supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("items")
        .select("*, category:categories(id, name, slug, icon, color)")
        .eq("is_available", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })
        .limit(8),
      supabase.from("items").select("category_id").eq("is_available", true),
    ]);

    if (!categoriesResult.error) {
      setCategories((categoriesResult.data ?? []) as Category[]);
    }
    if (!itemsResult.error) {
      setItems((itemsResult.data ?? []) as unknown as Item[]);
    }
    if (!countsResult.error) {
      const counts: Record<string, number> = {};
      for (const row of countsResult.data ?? []) {
        if (row.category_id) {
          counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
        }
      }
      setCategoryCounts(counts);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const featuredItems = items.slice(0, 8);

  return (
    <div className="flex flex-col gap-14 sm:gap-20">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-[linear-gradient(135deg,var(--brand),var(--brand-2))] px-6 py-8 text-white shadow-lg sm:px-12 sm:py-12">
        {/* dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 bg-[radial-gradient(rgba(255,255,255,0.35)_1px,transparent_1px)] bg-size-[22px_22px] mask-[linear-gradient(to_bottom_right,black,transparent_70%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-accent/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-black/10"
        />

        <div className="relative grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5 text-brand-accent" />
              Delivery to your exact location
            </p>
            <h1 className="mt-5 max-w-xl text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Everyday essentials from {settings.shop_name}
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-white/85 sm:text-lg">
              Clear prices, live stock counts, and a checkout that takes
              seconds.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="font-bold shadow-sm"
              >
                <Link to="/items">
                  Shop all items
                  <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <a href="#categories">Browse categories</a>
              </Button>
            </div>
          </div>

          <div className="hidden grid-cols-2 gap-3 lg:grid">
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <Truck className="h-6 w-6 text-brand-accent" />
              <p className="mt-3 text-sm font-semibold">Fast Delivery</p>
              <p className="mt-1 text-xs text-white/80">
                Pin your exact delivery location at checkout.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 p-4">
              <ShieldCheck className="h-6 w-6 text-brand-accent" />
              <p className="mt-3 text-sm font-semibold">Live Stock</p>
              <p className="mt-1 text-xs text-white/80">
                Real-time availability on every item.
              </p>
            </div>
            <div className="col-span-2 rounded-2xl border border-white/15 bg-white/10 p-4">
              <CheckCircle2 className="h-6 w-6 text-brand-accent" />
              <p className="mt-2 text-sm font-semibold">Pay on Confirmation</p>
              <p className="mt-1 text-xs text-white/80">
                Place your order in seconds and pay when the shop confirms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {loading || categories.length > 0 ? (
        <section id="categories" className="-my-4 scroll-mt-24 sm:-my-6">
          <h2 className="sr-only">Shop by category</h2>

          {loading ? (
            <div className="mx-auto flex max-w-5xl justify-center-safe gap-3 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden sm:gap-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="aspect-4/5 w-[calc(50%-0.375rem)] shrink-0 rounded-2xl sm:w-48 lg:w-56"
                />
              ))}
            </div>
          ) : (
            <div
              ref={categoryScrollRef}
              onPointerDown={drag.onPointerDown}
              onClickCapture={drag.onClickCapture}
              onDragStart={(event) => event.preventDefault()}
              className="mx-auto flex max-w-5xl cursor-grab justify-center-safe gap-3 overflow-x-auto pb-2 select-none active:cursor-grabbing scrollbar-none [&::-webkit-scrollbar]:hidden sm:gap-4"
            >
              {categories.map((category) => {
                const count = categoryCounts[category.id] ?? 0;
                const color = category.color || DEFAULT_COLOR;
                const IconComponent =
                  iconMap[category.icon || DEFAULT_ICON] ?? FolderTree;
                return (
                  <Link
                    key={category.id}
                    to={`/items?category=${encodeURIComponent(category.slug)}`}
                    className="group relative flex aspect-4/5 w-[calc(50%-0.375rem)] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border p-4 shadow-sm transition-[border-color,box-shadow] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48 sm:p-5 lg:w-56"
                    style={{
                      backgroundColor: `${color}14`,
                      borderColor: `${color}33`,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm sm:h-14 sm:w-14"
                        style={{ backgroundColor: color }}
                      >
                        <IconComponent size={24} color="#ffffff" />
                      </span>
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-foreground shadow-sm transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        aria-hidden
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="block text-balance wrap-break-word text-base font-bold leading-snug tracking-tight sm:text-lg">
                        {category.name}
                      </span>
                      <Badge className="mt-2 border-transparent bg-white px-2 py-0.5 text-[11px] text-foreground shadow-sm">
                        {count} item{count === 1 ? "" : "s"}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {/* Featured products */}
      {loading || featuredItems.length > 0 ? (
        <section className="flex flex-col gap-6">
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground sm:h-12 sm:w-12">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Popular picks
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fresh in the shop and ready to order.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/items">
                Browse all items
                <ArrowRight />
              </Link>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border sm:rounded-2xl"
                >
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-2 p-3 sm:p-4">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-5 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {featuredItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      {/* How shopping works: one band, divided, not three separate cards */}
      <section className="overflow-hidden rounded-3xl border bg-muted/40">
        <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {PERKS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-start gap-4 p-6 sm:p-8">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing call to action */}
      <section className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-foreground px-6 py-10 text-background sm:flex-row sm:items-center sm:px-12">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to fill your basket?
          </h2>
          <p className="mt-2 max-w-md text-sm text-background/70">
            Pick your items, pin your location, and the shop takes it from
            there.
          </p>
        </div>
        <Button asChild size="lg" variant="secondary" className="font-bold">
          <Link to="/items">
            Start shopping
            <ArrowRight />
          </Link>
        </Button>
      </section>
    </div>
  );
}
