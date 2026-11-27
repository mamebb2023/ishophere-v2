import { Button } from '@/components/ui/button'
import { useDragScroll } from '@/hooks/useDragScroll'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'
import { useRef } from 'react'

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[]
  selected: string | null
  onSelect: (categoryId: string | null) => void
}) {
  const categoryScrollRef = useRef<HTMLDivElement>(null)
  const drag = useDragScroll(categoryScrollRef)

  return (
    <div
      ref={categoryScrollRef}
      onPointerDown={drag.onPointerDown}
      onClickCapture={drag.onClickCapture}
      onDragStart={(event) => event.preventDefault()}
      className="-mx-4 flex cursor-grab select-none gap-2 overflow-x-auto px-4 pb-1 active:cursor-grabbing [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:px-0"
    >
      <Button
        type="button"
        size="sm"
        variant={selected === null ? 'default' : 'outline'}
        className={cn('h-auto shrink-0 rounded-full px-3 py-1.5')}
        onClick={() => onSelect(null)}
      >
        All items
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          type="button"
          size="sm"
          variant={selected === category.id ? 'default' : 'outline'}
          className="h-auto shrink-0 rounded-full px-3 py-1.5"
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
