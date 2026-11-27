import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { PanelHeader } from "./PanelHeader";

interface SignOutTabProps {
  signingOut: boolean;
  handleSignOut: () => void;
}

export function SignOutTab({
  signingOut,
  handleSignOut,
}: SignOutTabProps) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <PanelHeader
        icon={LogOut}
        title="Sign out"
        description="Log out of your account on this device."
        tone="danger"
      />
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          You will be signed out and redirected to the shop home page.
          You can sign in again at any time.
        </p>
        <Button
          variant="destructive"
          className="ml-auto"
          onClick={() => void handleSignOut()}
          disabled={signingOut}
        >
          {signingOut ? <Spinner /> : <LogOut className="h-4 w-4" />}
          Sign out
        </Button>
      </CardContent>
    </Card>
  );
}
