import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ICONS } from './IconPicker'

interface IconSelectProps {
  value: string
  onChange: (name: string) => void
}

export function IconSelect({ value, onChange }: IconSelectProps) {
  const Selected = ICONS.find((i) => i.name === value)?.Component ?? undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-lg border border-input bg-card px-3 py-2 text-sm transition-[border-color,box-shadow] duration-150 ease-out hover:border-foreground/20 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card disabled:cursor-not-allowed disabled:border-input disabled:bg-muted disabled:opacity-60 sm:text-sm',
          )}
        >
          {Selected ? <Selected size={16} /> : <span className="text-muted-foreground">Select icon</span>}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-0 max-h-64 overflow-y-auto" side="bottom" align="start">
        <DropdownMenuGroup className="p-2">
          <div className="grid grid-cols-6 gap-2">
            {ICONS.map(({ name, Component }) => (
              <DropdownMenuItem
                key={name}
                onClick={() => onChange(name)}
                className={cn(
                  'flex h-10 w-10 shrink-0 aspect-square min-h-auto items-center justify-center rounded-lg text-sm transition-colors p-0',
                  value === name
                    ? 'ring-2 ring-offset-1 ring-primary bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Component size={16} />
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
