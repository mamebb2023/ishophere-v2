import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AccountTab<T extends string = string> {
  id: T
  label: string
  description: string
  icon: LucideIcon
}

interface AccountTabsProps<T extends string> {
  tabs: readonly AccountTab<T>[]
  active: T
  onChange: (id: T) => void
}

export function AccountTabs<T extends string>({
  tabs,
  active,
  onChange,
}: AccountTabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef(new Map<T, HTMLButtonElement>())
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(min-width: 64rem)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(min-width: 64rem)')
    const update = () => setIsDesktop(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const list = listRef.current
    const button = tabRefs.current.get(active)
    if (!list || !button || list.scrollWidth <= list.clientWidth) return

    const listRect = list.getBoundingClientRect()
    const buttonRect = button.getBoundingClientRect()
    const left =
      list.scrollLeft +
      buttonRect.left -
      listRect.left -
      (listRect.width - buttonRect.width) / 2

    list.scrollTo({
      left: Math.max(0, left),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    })
  }, [active])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = tabs.findIndex((tab) => tab.id === active)
    let nextIndex = currentIndex

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIndex = (currentIndex + 1) % tabs.length
        break
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
        break
      case 'Home':
        nextIndex = 0
        break
      case 'End':
        nextIndex = tabs.length - 1
        break
      default:
        return
    }

    event.preventDefault()
    const nextTab = tabs[nextIndex]
    onChange(nextTab.id)
    tabRefs.current.get(nextTab.id)?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Account sections"
      aria-orientation={isDesktop ? 'vertical' : 'horizontal'}
      onKeyDown={handleKeyDown}
      className="flex min-w-0 gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-2xl lg:border lg:bg-card lg:p-2"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const selected = tab.id === active

        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) tabRefs.current.set(tab.id, node)
              else tabRefs.current.delete(tab.id)
            }}
            type="button"
            role="tab"
            id={`account-tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`account-panel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:w-full lg:items-start lg:gap-3 lg:rounded-xl lg:border-0 lg:px-3 lg:py-3 lg:text-left',
              selected
                ? 'border-primary bg-primary text-primary-foreground shadow-sm lg:bg-primary/10 lg:text-foreground lg:shadow-none'
                : 'border-border bg-card text-muted-foreground hover:border-foreground/20 hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-primary lg:block',
                selected ? 'opacity-100' : 'opacity-0',
              )}
            />
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-lg transition-colors lg:h-9 lg:w-9 lg:border',
                selected
                  ? 'lg:border-primary lg:bg-primary lg:text-primary-foreground'
                  : 'lg:border-border lg:bg-background lg:text-muted-foreground',
              )}
            >
              <Icon aria-hidden="true" className="h-4 w-4" />
            </span>
            <span className="min-w-0 lg:flex lg:flex-col lg:gap-0.5">
              <span>{tab.label}</span>
              <span className="hidden text-xs font-normal leading-snug text-muted-foreground lg:block">
                {tab.description}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
