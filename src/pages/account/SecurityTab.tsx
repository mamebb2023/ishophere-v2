import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { PanelHeader } from "./PanelHeader";

interface SecurityTabProps {
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmNewPassword: string;
  setConfirmNewPassword: (value: string) => void;
  changingPassword: boolean;
  handleSavePassword: () => void;
  cancelPasswordEdit: () => void;
}

export function SecurityTab({
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmNewPassword,
  setConfirmNewPassword,
  changingPassword,
  handleSavePassword,
  cancelPasswordEdit,
}: SecurityTabProps) {
  return (
    <Card>
      <PanelHeader
        icon={KeyRound}
        title="Password"
        description="Use at least 6 characters. You'll stay signed in on this device."
      />
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSavePassword();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-current-password">
              Current password
            </Label>
            <Input
              id="account-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(event.target.value)
              }
            />
          </div>
          <div className="grid grid-cols-2 items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-new-password">New password</Label>
              <Input
                id="account-new-password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-confirm-new-password">
                Confirm password
              </Label>
              <Input
                id="account-confirm-new-password"
                type="password"
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(event) =>
                  setConfirmNewPassword(event.target.value)
                }
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={cancelPasswordEdit}
              disabled={
                changingPassword ||
                (!currentPassword &&
                  !newPassword &&
                  !confirmNewPassword)
              }
            >
              Cancel
            </Button>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? <Spinner /> : null}
              Change password
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
