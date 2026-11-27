import { Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PanelHeader } from "./PanelHeader";

interface DangerZoneProps {
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  deletePassword: string;
  setDeletePassword: (value: string) => void;
  deletingAccount: boolean;
  handleDeleteAccount: () => void;
}

export function DangerZone({
  deleteOpen,
  setDeleteOpen,
  deletePassword,
  setDeletePassword,
  deletingAccount,
  handleDeleteAccount,
}: DangerZoneProps) {
  return (
    <Card className="border-destructive/40 bg-destructive/5">
      <PanelHeader
        icon={TriangleAlert}
        title="Danger zone"
        description="Permanently delete your account and personal details."
        tone="danger"
      />
      <CardContent className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Your name, phone, email, address, and profile are removed.
          Your order history stays in the shop with personal details
          anonymized. This cannot be undone.
        </p>
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              className="ml-auto"
              disabled={deletingAccount}
            >
              {deletingAccount ? <Spinner /> : <Trash2 />}
              Delete My Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account</DialogTitle>
              <DialogDescription>
                This permanently removes your name, phone, email, and
                profile. Your order history is kept with personal
                details removed. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <form
              className="mt-4 flex flex-col gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                void handleDeleteAccount();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="account-delete-password">
                  Current password
                </Label>
                <Input
                  id="account-delete-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Confirm it's you"
                  value={deletePassword}
                  onChange={(event) =>
                    setDeletePassword(event.target.value)
                  }
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteOpen(false)}
                  disabled={deletingAccount}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={deletingAccount}>
                  {deletingAccount ? <Spinner /> : null}
                  Delete
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
