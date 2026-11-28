import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FolderTree, ShoppingBag, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ICONS } from "@/components/admin/IconPicker";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { getErrorMessage } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { successFeedback, tapFeedback } from "@/lib/native";
import { setPendingCartAction } from "@/lib/pendingCart";
import type { Item } from "@/lib/types";

const DEFAULT_ICON = "FolderTree";
const DEFAULT_COLOR = "#1e5b3a";

function getContrastColor(hex: string): "dark" | "light" {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "dark" : "light";
}

const ICON_MAP = Object.fromEntries(
  ICONS.map(({ name, Component }) => [name, Component]),
);

export function ItemCard({ item }: { item: Item }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const { lines, add, setQuantity } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const showImage = Boolean(item.image_url) && !imageFailed;
  const cartLine = lines.find((line) => line.item_id === item.id);
  const quantity = cartLine?.quantity ?? 0;
  const soldOut = item.stock <= 0;
  const maxQuantity = Math.max(1, Math.min(item.stock, 99));
  const categoryColor = item.category?.color || DEFAULT_COLOR;
  const CategoryIcon =
    ICON_MAP[item.category?.icon || DEFAULT_ICON] ?? FolderTree;

  async function handleAdd() {
    if (soldOut || busy) return;

    if (!user) {
      setPendingCartAction(item.id, 1);
      toast.info("Sign in to add items to your cart");
      const next = `${location.pathname}${location.search}`;
      navigate(`/auth?next=${encodeURIComponent(next)}`);
      return;
    }

    setBusy(true);
    try {
      await add(item.id, 1);
      void successFeedback();
      toast.success(`Added ${item.name} to cart`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleQuantity(nextQuantity: number) {
    if (busy) return;
    setBusy(true);
    try {
      await setQuantity(item.id, nextQuantity);
      void tapFeedback();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-md">
      <Link
        to={`/item/${item.id}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="p-1.5 sm:p-2">
          <div className="relative aspect-square overflow-hidden rounded-xl bg-muted border border-border sm:rounded-[14px]">
            {showImage ? (
              <>
                {/* Blurred fill so portrait images do not look squeezed. */}
                <img
                  src={item.image_url ?? ""}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full scale-110 object-cover opacity-90 blur-md"
                />
                <img
                  src={item.image_url ?? ""}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImageFailed(true)}
                  className={`relative h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.03] ${
                    soldOut ? "opacity-60 grayscale" : ""
                  }`}
                />
              </>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ShoppingBag className="h-8 w-8" />
                <span className="text-xs">No image</span>
              </div>
            )}

            {soldOut ? (
              <Badge className="absolute left-1.5 top-1.5 border-transparent bg-foreground px-2 text-[10px] text-background shadow-sm sm:left-2 sm:top-2 sm:px-2.5 sm:text-xs">
                Sold out
              </Badge>
            ) : item.stock < 5 ? (
              <Badge
                variant="warning"
                className="absolute left-1.5 top-1.5 px-2 text-[10px] shadow-sm sm:left-2 sm:top-2 sm:px-2.5 sm:text-xs"
              >
                Only {item.stock} left
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 px-3 pb-3 pt-2 sm:px-4 sm:pt-3">
          {item.category ? (
            <span
              className="inline-flex w-fit max-w-full items-center gap-1 rounded-full border border-border/40 py-0.5 pl-1.5 pr-2 text-[10px] font-medium sm:text-[11px]"
              style={{
                backgroundColor: categoryColor,
                color: getContrastColor(categoryColor) === "dark" ? "#111827" : "#ffffff",
              }}
            >
              <CategoryIcon
                size={12}
                color={getContrastColor(categoryColor) === "dark" ? "#111827" : "#ffffff"}
              />
              <span className="truncate">{item.category.name}</span>
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
            <span className="text-base font-bold text-primary sm:text-xl">
              {formatMoney(item.price_cents)}
            </span>
            {item.stock >= 5 ? (
              <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                In stock
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <div className="px-3 pb-3 sm:px-4 sm:pb-4">
        {quantity > 0 ? (
          <QuantityStepper
            value={quantity}
            onChange={(nextQuantity) => {
              void handleQuantity(nextQuantity);
            }}
            max={maxQuantity}
            min={0}
            disabled={busy}
            className="w-full justify-between"
          />
        ) : (
          <Button
            size="sm"
            variant={soldOut ? "outline" : "default"}
            className="w-full cursor-pointer"
            disabled={soldOut || busy}
            onClick={() => {
              void handleAdd();
            }}
          >
            {busy ? <Spinner /> : <ShoppingCart />}
            {soldOut ? "Out of stock" : "Add to cart"}
          </Button>
        )}
      </div>
    </div>
  );
}
