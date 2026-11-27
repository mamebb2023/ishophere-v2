import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BellRing,
  KeyRound,
  LogOut,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { AccountHeader } from "./AccountHeader";
import { ProfileSidebar } from "./ProfileSidebar";
import { DetailsTab } from "./DetailsTab";
import { SecurityTab } from "./SecurityTab";
import { DangerZone } from "./DangerZone";
import { SignOutTab } from "./SignOutTab";
import { NotificationsTab } from "./NotificationsTab";
import { useAuth } from "@/hooks/useAuth";
import { useSeo } from "@/hooks/useSeo";
import { getErrorMessage } from "@/lib/format";
import { isValidPhone } from "@/lib/phone";
import {
  getUserDisplayName,
  getUserEmail,
  getUserIdentifier,
  getUserName,
  getUserPhone,
} from "@/lib/user";
import type { AccountTab } from "@/components/account/AccountTabs";
import { AppLockSettings } from "@/components/account/AppLockSettings";

type AccountTabId = "details" | "security" | "notifications" | "sign-out";

const ACCOUNT_TABS: readonly AccountTab<AccountTabId>[] = [
  {
    id: "details",
    label: "Details",
    description: "Name, phone, and email",
    icon: UserRound,
  },
  {
    id: "security",
    label: "Security",
    description: "Password, app lock, and deletion",
    icon: KeyRound,
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Alerts on this device",
    icon: BellRing,
  },
  {
    id: "sign-out",
    label: "Sign out",
    description: "Log out of your account.",
    icon: LogOut,
  },
];

export function Account() {
  const {
    user,
    profile,
    profileLoading,
    isAdmin,
    signOut,
    updateProfile,
    addEmail,
    changePassword,
    deleteAccount,
  } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AccountTabId>("details");
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useSeo({
    title: "Your account",
    description: "Manage your Tofik Store name, email, and phone number.",
    path: "/account",
    noIndex: true,
  });

  const displayName = getUserDisplayName(user, profile);
  const identifier = getUserIdentifier(user, profile);
  const accountName = getUserName(user, profile);
  const accountPhone = getUserPhone(user, profile);
  const accountEmail = getUserEmail(user, profile);
  const accountTabs = ACCOUNT_TABS;

  useEffect(() => {
    setName(accountName);
  }, [accountName]);

  useEffect(() => {
    setPhone(accountPhone);
  }, [accountPhone]);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
      toast.success("Signed out");
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSigningOut(false);
    }
  }

  async function handleSaveName() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      toast.error("Name must be at least 2 characters");
      return;
    }
    if (trimmed.length > 120) {
      toast.error("Name is too long");
      return;
    }
    setSavingName(true);
    try {
      await updateProfile({ name: trimmed });
      setEditingName(false);
      toast.success("Name updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingName(false);
    }
  }

  async function handleSavePhone() {
    if (!isValidPhone(phone)) {
      toast.error("Enter a valid phone number");
      return;
    }
    setSavingPhone(true);
    try {
      await updateProfile({ phone });
      setEditingPhone(false);
      toast.success("Phone number saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingPhone(false);
    }
  }

  async function handleSaveEmail() {
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (emailPassword.length < 6) {
      toast.error("Enter your current password");
      return;
    }
    setSavingEmail(true);
    try {
      await addEmail(trimmed, emailPassword);
      setEditingEmail(false);
      setEmail("");
      setEmailPassword("");
      toast.success("Email saved");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleSavePassword() {
    if (currentPassword.length < 6) {
      toast.error("Enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      toast.error("New password must be different from current password");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password updated");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      toast.error("Enter your current password");
      return;
    }
    setDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      toast.success("Account deleted");
      navigate("/");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeletingAccount(false);
      setDeletePassword("");
    }
  }

  function cancelNameEdit() {
    setEditingName(false);
    setName(accountName);
  }

  function cancelPhoneEdit() {
    setEditingPhone(false);
    setPhone(accountPhone);
  }

  function cancelEmailEdit() {
    setEditingEmail(false);
    setEmail("");
    setEmailPassword("");
  }

  function cancelPasswordEdit() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <AccountHeader />
          <p className="text-sm text-muted-foreground">
            Manage your details, security, and notifications.
          </p>
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-x-6 gap-y-0 lg:gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
        <ProfileSidebar
          user={user}
          isAdmin={isAdmin}
          displayName={displayName}
          identifier={identifier}
          accountTabs={accountTabs}
          activeTab={activeTab}
          setActiveTab={(id: string) => setActiveTab(id as AccountTabId)}
        />

        <div className="relative z-0 min-w-0">
          <section
            role="tabpanel"
            id="account-panel-details"
            aria-labelledby="account-tab-details"
            tabIndex={0}
            hidden={activeTab !== "details"}
            className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0"
          >
            <DetailsTab
              profileLoading={profileLoading}
              accountName={accountName}
              accountPhone={accountPhone}
              accountEmail={accountEmail}
              editingName={editingName}
              setEditingName={setEditingName}
              name={name}
              setName={setName}
              savingName={savingName}
              handleSaveName={handleSaveName}
              editingPhone={editingPhone}
              setEditingPhone={setEditingPhone}
              phone={phone}
              setPhone={setPhone}
              savingPhone={savingPhone}
              handleSavePhone={handleSavePhone}
              editingEmail={editingEmail}
              setEditingEmail={setEditingEmail}
              email={email}
              setEmail={setEmail}
              emailPassword={emailPassword}
              setEmailPassword={setEmailPassword}
              savingEmail={savingEmail}
              handleSaveEmail={handleSaveEmail}
              cancelNameEdit={cancelNameEdit}
              cancelPhoneEdit={cancelPhoneEdit}
              cancelEmailEdit={cancelEmailEdit}
            />
          </section>

          <section
            role="tabpanel"
            id="account-panel-security"
            aria-labelledby="account-tab-security"
            tabIndex={0}
            hidden={activeTab !== "security"}
            className="min-w-0 space-y-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0"
          >
            <SecurityTab
              currentPassword={currentPassword}
              setCurrentPassword={setCurrentPassword}
              newPassword={newPassword}
              setNewPassword={setNewPassword}
              confirmNewPassword={confirmNewPassword}
              setConfirmNewPassword={setConfirmNewPassword}
              changingPassword={changingPassword}
              handleSavePassword={handleSavePassword}
              cancelPasswordEdit={cancelPasswordEdit}
            />
            <AppLockSettings />
            <DangerZone
              deleteOpen={deleteOpen}
              setDeleteOpen={setDeleteOpen}
              deletePassword={deletePassword}
              setDeletePassword={setDeletePassword}
              deletingAccount={deletingAccount}
              handleDeleteAccount={handleDeleteAccount}
            />
          </section>

          <section
            role="tabpanel"
            id="account-panel-notifications"
            aria-labelledby="account-tab-notifications"
            tabIndex={0}
            hidden={activeTab !== "notifications"}
            className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0"
          >
            <NotificationsTab />
          </section>

          <section
            role="tabpanel"
            id="account-panel-sign-out"
            aria-labelledby="account-tab-sign-out"
            tabIndex={0}
            hidden={activeTab !== "sign-out"}
            className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0"
          >
            <SignOutTab
              signingOut={signingOut}
              handleSignOut={handleSignOut}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
