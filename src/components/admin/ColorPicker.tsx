import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";

const COLORS: string[] = [
  "#1e5b3a", // brand green
  "#15803d", // green
  "#0f766e", // teal
  "#0891b2", // cyan
  "#2563eb", // blue
  "#4f46e5", // indigo
  "#7c3aed", // violet
  "#c026d3", // fuchsia
  "#db2777", // pink
  "#e11d48", // rose
  "#dc2626", // red
  "#ea580c", // orange
  "#b45309", // amber
  "#4a3728", // brown
  "#475569", // slate
];
interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-input bg-card p-3">
      <div className="flex flex-wrap gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Color: ${color}`}
            onClick={() => onChange(color)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
              value === color ? "ring-2 ring-offset-1 ring-primary" : "",
            )}
            style={{ backgroundColor: color }}
          >
            {value === color && <Check size={16} color="#ffffff" />}
          </button>
        ))}
        <label className="relative group">
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="sr-only"
          />
          <button
            type="button"
            aria-label="Custom color"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              (event.currentTarget as HTMLButtonElement).parentElement
                ?.querySelector("input")
                ?.click();
            }}
            className={cn(
              "h-8 w-8 rounded-full relative z-10 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
            )}
            style={{ backgroundColor: value }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-white opacity-90 group-hover:opacity-100">
              <Pipette size={16} />
            </span>
          </button>
        </label>
        <p className="text-xs text-muted-foreground">
          Pick a color for this category's icon badge.
        </p>
      </div>
    </div>
  );
}
