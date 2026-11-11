import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/types'

export function CategoryFilter({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[]
  selected: string | null
  onSelect: (categoryId: string | null) => void
}) {
  return (
    <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      <Button
        type="button"
        size="sm"
        variant={selected === null ? 'default' : 'outline'}
        className={cn('shrink-0 rounded-full')}
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
          className="shrink-0 rounded-full"
          onClick={() => onSelect(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  )
}
