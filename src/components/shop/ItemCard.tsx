import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ImageOff, ShoppingBag } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/money'
import type { Item } from '@/lib/types'

export function ItemCard({ item }: { item: Item }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(item.image_url) && !imageFailed

  return (
    <Link
      to={`/item/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {showImage ? (
          <img
            src={item.image_url ?? ''}
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
            className="absolute left-2 top-2 shadow-sm"
          >
            Only {item.stock} left
          </Badge>
        ) : null}
        {item.stock === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-[1px]">
            <Badge variant="muted" className="gap-1">
              <ImageOff className="h-3 w-3" />
              Sold out
            </Badge>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        {item.category ? (
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {item.category.name}
          </span>
        ) : null}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">
          {item.name}
        </h3>
        {item.description ? (
          <p className="line-clamp-2 text-xs text-muted-foreground">
            {item.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-base font-bold text-primary sm:text-lg">
            {formatMoney(item.price_cents)}
          </span>
          {item.stock >= 5 ? (
            <span className="text-xs text-muted-foreground">In stock</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
