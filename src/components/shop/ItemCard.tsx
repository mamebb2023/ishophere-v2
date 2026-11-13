import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/hooks/useStore";
import { formatMoney } from "@/lib/money";
import { storePath } from "@/lib/storeRoutes";
import type { Item } from "@/lib/types";

export function ItemCard({ item }: { item: Item }) {
  const { store } = useStore();
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(item.image_url) && !imageFailed;

  return (
    <Link
      to={storePath(store.slug, `/item/${item.id}`)}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:rounded-2xl"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        {showImage ? (
          <img
            src={item.image_url ?? ""}
            alt={item.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <ShoppingBag className="h-8 w-8" />
            <span className="text-xs">No image</span>
          </div>
        )}
        {item.stock > 0 && item.stock < 5 ? (
          <Badge
            variant="warning"
            className="absolute left-1.5 top-1.5 px-2 text-[10px] shadow-sm sm:left-2 sm:top-2 sm:px-2.5 sm:text-xs"
          >
            Only {item.stock} left
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        {item.category ? (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]">
            {item.category.name}
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
          {item.name}
        </h3>
        {item.description ? (
          <p className="hidden line-clamp-2 text-xs text-muted-foreground sm:block">
            {item.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-bold text-primary sm:text-lg">
            {formatMoney(item.price_cents)}
          </span>
          {item.stock >= 5 ? (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              In stock
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
