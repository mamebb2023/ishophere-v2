import { NavLink, Outlet } from "react-router-dom";
import { useRef } from "react";
import {
  FolderTree,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { DeviceNotificationPrompt } from "@/components/layout/DeviceNotificationPrompt";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { SkipLink } from "@/components/layout/SkipLink";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useNewOrderCount } from "@/hooks/useNewOrderCount";
import { useSeo } from "@/hooks/useSeo";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/categories", label: "Categories", icon: FolderTree },
  { to: "/admin/items", label: "Items", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout() {
  const newOrderCount = useNewOrderCount();
  const adminScrollRef = useRef<HTMLDivElement>(null);
  const drag = useDragScroll(adminScrollRef);

  useSeo({
    title: "Admin",
    description: "Tofik Store shop management.",
    noIndex: true,
  });

  return (
    <div className="flex min-h-dvh flex-col bg-muted/30">
      <SkipLink />
      <Header />
      <nav
        ref={adminScrollRef}
        onPointerDown={drag.onPointerDown}
        onClickCapture={drag.onClickCapture}
        onDragStart={(event) => event.preventDefault()}
        className="mx-auto relative flex w-full max-w-6xl cursor-grab select-none gap-1 overflow-x-auto px-safe pt-2 z-10 -mb-0.5 active:cursor-grabbing scrollbar-none [&::-webkit-scrollbar]:hidden"
      >
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "relative flex shrink-0 items-center gap-2 rounded-t-xl border border-b-0 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                isActive
                  ? "border-b border-b-white bg-card text-foreground"
                  : "border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
            {item.to === "/admin/orders" && newOrderCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {newOrderCount > 99 ? "99+" : newOrderCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <main
        id="main"
        tabIndex={-1}
        className="mx-2 md:mx-auto md:w-full max-w-6xl px-safe pb-mobile-nav pt-6 border rounded-xl bg-card"
      >
        <Outlet />
      </main>

      {/* Pushes footer to the bottom on short pages */}
      <div className="flex-1" />

      <DeviceNotificationPrompt admin />

      <Footer />
      <MobileNav />
    </div>
  );
}
