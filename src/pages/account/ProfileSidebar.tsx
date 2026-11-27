import { Link } from "react-router-dom";
import { LayoutDashboard, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/format";
import { AccountTabs } from "@/components/account/AccountTabs";
import type { AccountTab } from "@/components/account/AccountTabs";

interface ProfileSidebarProps {
  user: { created_at?: string | null } | null;
  isAdmin: boolean;
  displayName: string;
  identifier: string;
  accountTabs: readonly AccountTab<string>[];
  activeTab: string;
  setActiveTab: (id: string) => void;
}

export function ProfileSidebar({
  user,
  isAdmin,
  displayName,
  identifier,
  accountTabs,
  activeTab,
  setActiveTab,
}: ProfileSidebarProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <UserRound aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              {identifier && identifier !== displayName ? (
                <p className="truncate text-xs text-muted-foreground">
                  {identifier}
                </p>
              ) : null}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isAdmin ? "Shop owner" : "Customer"}
            {user?.created_at ? ` · Joined ${formatDate(user.created_at)}` : ""}
          </p>
          {isAdmin ? (
            <Button asChild size="sm" variant="outline" className="w-full">
              <Link to="/admin">
                <LayoutDashboard />
                Admin dashboard
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="relative z-10 pl-3">
        <AccountTabs
          tabs={accountTabs}
          active={activeTab}
          onChange={setActiveTab}
        />
      </div>
    </div>
  );
}
