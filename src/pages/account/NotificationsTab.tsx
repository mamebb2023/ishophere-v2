import { BellRing } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { PanelHeader } from "./PanelHeader";

export function NotificationsTab() {
  return (
    <Card>
      <PanelHeader
        icon={BellRing}
        title="Notifications"
        description="Choose the alerts this device receives."
      />
      <CardContent>
        <NotificationPreferences />
      </CardContent>
    </Card>
  );
}
