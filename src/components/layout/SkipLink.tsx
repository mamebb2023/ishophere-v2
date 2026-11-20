export function SkipLink({ targetId = 'main' }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="fixed left-4 top-4 z-[60] -translate-y-24 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-transform duration-150 ease-[var(--ease-out)] focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background motion-reduce:transition-none"
    >
      Skip to content
    </a>
  )
}
