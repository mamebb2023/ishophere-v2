import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  LayoutDashboard,
  Package,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getErrorMessage } from "@/lib/format";
import { formatMoney } from "@/lib/money";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { Order } from "@/lib/types";

interface Stats {
  salesCents: number;
  orderCount: number;
  itemCount: number;
  lowStockCount: number;
}

export function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats>({
    salesCents: 0,
    orderCount: 0,
    itemCount: 0,
    lowStockCount: 0,
  });
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const [statsResult, recentResult] = await Promise.all([
      supabase.rpc("admin_stats"),
      supabase
        .from("orders")
        .select("id, customer_name, status, total_cents, created_at")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (statsResult.error || recentResult.error) {
      setError(getErrorMessage(statsResult.error || recentResult.error));
    } else {
      const s = statsResult.data as {
        sales_cents: number;
        order_count: number;
        new_count: number;
        item_count: number;
        low_stock_count: number;
      };
      setOrders((recentResult.data ?? []) as unknown as Order[]);
      setNewOrderCount(s.new_count);
      setStats({
        salesCents: s.sales_cents,
        orderCount: s.order_count,
        itemCount: s.item_count,
        lowStockCount: s.low_stock_count,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const recentOrders = orders.slice(0, 5);

  const cards: Array<{
    label: string;
    value: string;
    icon: LucideIcon;
    className: string;
    cardClassName: string;
    hint?: string;
  }> = [
    {
      label: "Total sales",
      value: formatMoney(stats.salesCents),
      icon: Banknote,
      className: "bg-success text-white",
      cardClassName: "bg-success/10 border-success/10",
    },
    {
      label: "Orders",
      value: String(stats.orderCount),
      icon: ReceiptText,
      className: "bg-info text-white",
      cardClassName: "bg-info/10 border-info/10",
      hint: newOrderCount > 0 ? `${newOrderCount} new` : undefined,
    },
    {
      label: "Items",
      value: String(stats.itemCount),
      icon: Package,
      className: "bg-warning text-white",
      cardClassName: "bg-warning/10 border-warning/10",
    },
    {
      label: "Low stock",
      value: String(stats.lowStockCount),
      icon: AlertTriangle,
      className: "bg-destructive text-white",
      cardClassName: "bg-destructive/10 border-destructive/10",
    },
  ];

  return (
    <div>
      <AdminPageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="A quick snapshot of the shop."
      />

      {error ? (
        <Alert
          variant="error"
          title="Could not load dashboard data"
          className="mb-5"
        >
          <p>{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => {
              void load();
            }}
          >
            <RefreshCw />
            Retry
          </Button>
        </Alert>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className={card.cardClassName}>
            <CardContent className="flex items-center gap-3 p-3 sm:p-4">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${card.className}`}
              >
                <card.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-muted-foreground">
                  {card.label}
                </p>
                {loading ? (
                  <Skeleton className="mt-1 h-6 w-16" />
                ) : (
                  <p className="truncate text-lg font-semibold sm:text-xl">
                    {card.value}
                  </p>
                )}
                {!loading && card.hint ? (
                  <p className="truncate text-[10px] font-bold uppercase tracking-wide text-destructive">
                    {card.hint}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 shrink-0 text-muted-foreground" />
              <CardTitle>Recent orders</CardTitle>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/orders">
                View all
                <ArrowRight />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-12 w-full" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No orders yet.
              </p>
            ) : (
              <div className="divide-y">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to="/admin/orders"
                    className="flex items-center gap-3 py-3 transition-colors hover:text-primary"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <ShoppingCart className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {order.customer_name}{" "}
                        <span className="font-mono text-xs text-muted-foreground">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className="hidden text-sm font-semibold sm:inline">
                      {formatMoney(order.total_cents)}
                    </span>
                    <StatusBadge status={order.status} />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground" />
              <CardTitle>Quick actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/items/new">
                <Plus />
                Add a new item
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/items">
                <Package />
                Manage items
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/orders">
                <ReceiptText />
                Manage orders
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/users">
                <Users />
                View users
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link to="/admin/settings">
                <Settings />
                Edit shop theme
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
