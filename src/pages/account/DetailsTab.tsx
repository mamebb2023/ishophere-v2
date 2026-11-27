import { UserRound, Pencil, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { PanelHeader } from "./PanelHeader";
import { formatPhoneNumber, isValidPhone } from "@/lib/phone";

interface DetailsTabProps {
  profileLoading: boolean;
  accountName: string | undefined;
  accountPhone: string | undefined;
  accountEmail: string | undefined;
  editingName: boolean;
  setEditingName: (value: boolean) => void;
  name: string;
  setName: (value: string) => void;
  savingName: boolean;
  handleSaveName: () => void;
  cancelNameEdit: () => void;
  editingPhone: boolean;
  setEditingPhone: (value: boolean) => void;
  phone: string;
  setPhone: (value: string) => void;
  savingPhone: boolean;
  handleSavePhone: () => void;
  cancelPhoneEdit: () => void;
  editingEmail: boolean;
  setEditingEmail: (value: boolean) => void;
  email: string;
  setEmail: (value: string) => void;
  emailPassword: string;
  setEmailPassword: (value: string) => void;
  savingEmail: boolean;
  handleSaveEmail: () => void;
  cancelEmailEdit: () => void;
}

export function DetailsTab({
  profileLoading,
  accountName,
  accountPhone,
  accountEmail,
  editingName,
  setEditingName,
  name,
  setName,
  savingName,
  handleSaveName,
  cancelNameEdit,
  editingPhone,
  setEditingPhone,
  phone,
  setPhone,
  savingPhone,
  handleSavePhone,
  cancelPhoneEdit,
  editingEmail,
  setEditingEmail,
  email,
  setEmail,
  emailPassword,
  setEmailPassword,
  savingEmail,
  handleSaveEmail,
  cancelEmailEdit,
}: DetailsTabProps) {
  return (
    <Card>
      <PanelHeader
        icon={UserRound}
        title="Contact details"
        description="How we reach you and how you sign in."
      />
      <CardContent className="flex flex-col">
        {profileLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="border-b pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <UserRound
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Name
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {accountName || "Not added"}
                    </p>
                  </div>
                </div>
                {!editingName ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingName(true)}
                  >
                    <Pencil />
                    {accountName ? "Edit" : "Add"}
                  </Button>
                ) : null}
              </div>

              {editingName ? (
                <form
                  className="mt-3 flex flex-col gap-2 sm:max-w-sm"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSaveName();
                  }}
                >
                  <Label htmlFor="account-name">Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="account-name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                    <Button type="submit" disabled={savingName}>
                      {savingName ? <Spinner /> : null}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelNameEdit}
                      disabled={savingName}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>

            <div className="border-b py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Phone
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Phone
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {accountPhone
                        ? formatPhoneNumber(accountPhone)
                        : "Not added"}
                    </p>
                  </div>
                </div>
                {!editingPhone ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingPhone(true)}
                  >
                    <Pencil />
                    {accountPhone ? "Edit" : "Add"}
                  </Button>
                ) : null}
              </div>

              {editingPhone ? (
                <form
                  className="mt-3 flex flex-col gap-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSavePhone();
                  }}
                >
                  <Label htmlFor="account-phone">Phone number</Label>
                  <PhoneInput
                    id="account-phone"
                    value={phone}
                    onChange={setPhone}
                    invalid={phone.length > 0 && !isValidPhone(phone)}
                  />
                  <p className="text-xs text-muted-foreground">
                    You can sign in with this phone number and your password.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={savingPhone || !isValidPhone(phone)}
                    >
                      {savingPhone ? <Spinner /> : null}
                      Save phone
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelPhoneEdit}
                      disabled={savingPhone}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>

            <div className="pt-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Mail
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Email
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {accountEmail || "Not added"}
                    </p>
                  </div>
                </div>
                {!editingEmail ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingEmail(true)}
                  >
                    <Pencil />
                    {accountEmail ? "Change" : "Add"}
                  </Button>
                ) : null}
              </div>

              {editingEmail ? (
                <form
                  className="mt-3 flex flex-col gap-3 sm:max-w-sm"
                  onSubmit={(event) => {
                    event.preventDefault();
                    handleSaveEmail();
                  }}
                >
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="account-email">Email</Label>
                    <Input
                      id="account-email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="account-email-password">
                      Current password
                    </Label>
                    <Input
                      id="account-email-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Confirm it's you"
                      value={emailPassword}
                      onChange={(event) =>
                        setEmailPassword(event.target.value)
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {accountEmail
                      ? "Your email changes immediately. Use it next time you sign in."
                      : "Add an email to sign in with it as well as your phone."}
                  </p>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={savingEmail}>
                      {savingEmail ? <Spinner /> : null}
                      Save email
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={cancelEmailEdit}
                      disabled={savingEmail}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : !accountEmail ? (
                <p className="mt-1 pl-7 text-xs text-muted-foreground">
                  Optional. Add one later to sign in with your email too.
                </p>
              ) : null}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
