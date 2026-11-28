import {
  Apple,
  Astroid,
  Award,
  Bed,
  Book,
  Building2,
  Cake,
  Camera,
  Carrot,
  Coffee,
  Crown,
  Flower,
  Folder,
  FolderTree,
  Gift,
  Guitar,
  Headphones,
  Heart,
  Home,
  House,
  Leaf,
  Laptop,
  MapPin,
  Music,
  Newspaper,
  Package,
  Phone,
  Plane,
  Play,
  Scissors,
  Shirt,
  ShoppingBag,
  ShoppingCart,
  Soup,
  Sparkles,
  Star,
  Store,
  Tag,
  Train,
  Truck,
  Tv,
  Utensils,
  Watch,
  Wine,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const ICON_NAMES = [
  "FolderTree",
  "Folder",
  "Package",
  "ShoppingBag",
  "ShoppingCart",
  "Tag",
  "Home",
  "Store",
  "Building",
  "Truck",
  "Leaf",
  "Flower",
  "Apple",
  "Bread",
  "Coffee",
  "Tea",
  "Wine",
  "Bottle",
  "Cake",
  "Cup",
  "Carrot",
  "Shirt",
  "Shoe",
  "Watch",
  "Phone",
  "Laptop",
  "Camera",
  "Tv",
  "Headphones",
  "Music",
  "Guitar",
  "Game2",
  "Book",
  "Newspaper",
  "Heart",
  "Star",
  "Crown",
  "Gift",
  "Paw",
  "MapPin",
  "Plane",
  "Train",
  "Bed",
  "Scissors",
  "Award",
  "Play",
  "Astroid",
  "Sparkles",
  "House",
  "Utensils",
  "Soup",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const ICONS: {
  name: IconName;
  Component: React.ComponentType<{ size?: number; color?: string }>;
}[] = [
  { name: "FolderTree", Component: FolderTree },
  { name: "Folder", Component: Folder },
  { name: "Package", Component: Package },
  { name: "ShoppingBag", Component: ShoppingBag },
  { name: "ShoppingCart", Component: ShoppingCart },
  { name: "Tag", Component: Tag },
  { name: "Home", Component: Home },
  { name: "Store", Component: Store },
  { name: "Building", Component: Building2 },
  { name: "Truck", Component: Truck },
  { name: "Leaf", Component: Leaf },
  { name: "Flower", Component: Flower },
  { name: "Apple", Component: Apple },
  { name: "Coffee", Component: Coffee },
  { name: "Wine", Component: Wine },
  { name: "Cake", Component: Cake },
  { name: "Carrot", Component: Carrot },
  { name: "Shirt", Component: Shirt },
  { name: "Watch", Component: Watch },
  { name: "Phone", Component: Phone },
  { name: "Laptop", Component: Laptop },
  { name: "Camera", Component: Camera },
  { name: "Tv", Component: Tv },
  { name: "Headphones", Component: Headphones },
  { name: "Music", Component: Music },
  { name: "Guitar", Component: Guitar },
  { name: "Book", Component: Book },
  { name: "Newspaper", Component: Newspaper },
  { name: "Heart", Component: Heart },
  { name: "Star", Component: Star },
  { name: "Crown", Component: Crown },
  { name: "Gift", Component: Gift },
  { name: "MapPin", Component: MapPin },
  { name: "Plane", Component: Plane },
  { name: "Train", Component: Train },
  { name: "Bed", Component: Bed },
  { name: "Scissors", Component: Scissors },
  { name: "Award", Component: Award },
  { name: "Play", Component: Play },
  { name: "Astroid", Component: Astroid },
  { name: "Sparkles", Component: Sparkles },
  { name: "House", Component: House },
  { name: "Utensils", Component: Utensils },
  { name: "Soup", Component: Soup },
];

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto p-2 border rounded-xl bg-muted/50">
      {ICONS.map(({ name, Component }) => (
        <button
          key={name}
          type="button"
          aria-label={`Icon: ${name}`}
          onClick={() => onChange(name)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-sm transition-colors",
            value === name
              ? "ring-2 ring-offset-1 ring-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <Component size={16} />
        </button>
      ))}
    </div>
  );
}
