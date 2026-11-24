import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BellRing,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Pencil,
  Phone,
  Trash2,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { AccountTabs, type AccountTab } from '@/components/account/AccountTabs'
import { NotificationPreferences } from '@/components/NotificationPreferences'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { useSeo } from '@/hooks/useSeo'
import { formatDate, getErrorMessage } from '@/lib/format'
import { formatPhoneNumber, isValidPhone } from '@/lib/phone'
import { isNativeApp } from '@/lib/platform'
import {
  getUserDisplayName,
  getUserEmail,
  getUserIdentifier,
  getUserName,
  getUserPhone,
} from '@/lib/user'

type AccountTabId = 'details' | 'security' | 'notifications'

const ACCOUNT_TABS: readonly AccountTab<AccountTabId>[] = [
  {
    id: 'details',
    label: 'Details',
    description: 'Name, phone, and email',
    icon: UserRound,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password and sign-in',
    icon: KeyRound,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alerts on this device',
    icon: BellRing,
  },
]

function PanelHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <CardHeader className="flex-row items-start gap-3 space-y-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon aria-hidden="true" className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold leading-snug tracking-tight">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </CardHeader>
  )
}

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
  } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AccountTabId>('details')
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [phone, setPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [savingEmail, setSavingEmail] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')

  useSeo({
    title: 'Your account',
    description: 'Manage your Tofik Store name, email, and phone number.',
    path: '/account',
    noIndex: true,
  })

  const displayName = getUserDisplayName(user, profile)
  const identifier = getUserIdentifier(user, profile)
  const accountName = getUserName(user, profile)
  const accountPhone = getUserPhone(user, profile)
  const accountEmail = getUserEmail(user, profile)
  const accountTabs = isNativeApp()
    ? ACCOUNT_TABS.filter((tab) => tab.id !== 'notifications')
    : ACCOUNT_TABS

  useEffect(() => {
    setName(accountName)
  }, [accountName])

  useEffect(() => {
    setPhone(accountPhone)
  }, [accountPhone])

  async function handleSignOut() {
    try {
      await signOut()
      toast.success('Signed out')
      navigate('/')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  async function handleSaveName() {
    const trimmed = name.trim()
    if (trimmed.length < 2) {
      toast.error('Name must be at least 2 characters')
      return
    }
    if (trimmed.length > 120) {
      toast.error('Name is too long')
      return
    }
    setSavingName(true)
    try {
      await updateProfile({ name: trimmed })
      setEditingName(false)
      toast.success('Name updated')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSavingName(false)
    }
  }

  async function handleSavePhone() {
    if (!isValidPhone(phone)) {
      toast.error('Enter a valid phone number')
      return
    }
    setSavingPhone(true)
    try {
      await updateProfile({ phone })
      setEditingPhone(false)
      toast.success('Phone number saved')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSavingPhone(false)
    }
  }

  async function handleSaveEmail() {
    const trimmed = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Enter a valid email address')
      return
    }
    if (emailPassword.length < 6) {
      toast.error('Enter your current password')
      return
    }
    setSavingEmail(true)
    try {
      await addEmail(trimmed, emailPassword)
      setEditingEmail(false)
      setEmail('')
      setEmailPassword('')
      toast.success('Email saved')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setSavingEmail(false)
    }
  }

  async function handleSavePassword() {
    if (currentPassword.length < 6) {
      toast.error('Enter your current password')
      return
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (currentPassword === newPassword) {
      toast.error('New password must be different from current password')
      return
    }
    setChangingPassword(true)
    try {
      await changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      toast.success('Password updated')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setChangingPassword(false)
    }
  }

  async function handleDeleteAccount() {
    if (!deletePassword) {
      toast.error('Enter your current password')
      return
    }
    setDeletingAccount(true)
    try {
      await deleteAccount(deletePassword)
      toast.success('Account deleted')
      navigate('/')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setDeletingAccount(false)
      setDeletePassword('')
    }
  }

  function cancelNameEdit() {    setEditingName(false)
    setName(accountName)
  }

  function cancelPhoneEdit() {
    setEditingPhone(false)
    setPhone(accountPhone)
  }

  function cancelEmailEdit() {
    setEditingEmail(false)
    setEmail('')
    setEmailPassword('')
  }

  function cancelPasswordEdit() {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            My account
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your details, security, and notifications.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </Button>
      </div>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
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
                {isAdmin ? 'Shop owner' : 'Customer'}
                {user?.created_at
                  ? ` · Joined ${formatDate(user.created_at)}`
                  : ''}
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

          <AccountTabs
            tabs={accountTabs}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="min-w-0">
          <section
            role="tabpanel"
            id="account-panel-details"
            aria-labelledby="account-tab-details"
            tabIndex={0}
            hidden={activeTab !== 'details'}
            className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0"
          >
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
                              {accountName || 'Not added'}
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
                            {accountName ? 'Edit' : 'Add'}
                          </Button>
                        ) : null}
                      </div>

                      {editingName ? (
                        <form
                          className="mt-3 flex flex-col gap-2 sm:max-w-sm"
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleSaveName()
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
                                : 'Not added'}
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
                            {accountPhone ? 'Edit' : 'Add'}
                          </Button>
                        ) : null}
                      </div>

                      {editingPhone ? (
                        <form
                          className="mt-3 flex flex-col gap-2"
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleSavePhone()
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
                            You can sign in with this phone number and your
                            password.
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
                              {accountEmail || 'Not added'}
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
                            {accountEmail ? 'Change' : 'Add'}
                          </Button>
                        ) : null}
                      </div>

                      {editingEmail ? (
                        <form
                          className="mt-3 flex flex-col gap-3 sm:max-w-sm"
                          onSubmit={(event) => {
                            event.preventDefault()
                            void handleSaveEmail()
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
                              ? 'Your email changes immediately. Use it next time you sign in.'
                              : 'Add an email to sign in with it as well as your phone.'}
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
          </section>

          <section
            role="tabpanel"
            id="account-panel-security"
            aria-labelledby="account-tab-security"
            tabIndex={0}
            hidden={activeTab !== 'security'}
            className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0"
          >
            <Card>
              <PanelHeader
                icon={KeyRound}
                title="Password"
                description="Use at least 6 characters. You'll stay signed in on this device."
              />
              <CardContent>
                <form
                  className="flex max-w-sm flex-col gap-3"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void handleSavePassword()
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
                      Confirm new password
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
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button type="submit" disabled={changingPassword}>
                      {changingPassword ? <Spinner /> : null}
                      Change password
                    </Button>
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
                  </div>
                </form>

                <div className="mt-6 flex gap-2">
                  <DialogTrigger asChild>
                    <Button variant="destructive" disabled={deletingAccount}>
                      {deletingAccount ? <Spinner /> : null}
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete account
                    </Button>
                  </DialogTrigger>
                  <Dialog>
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
                          event.preventDefault()
                          void handleDeleteAccount()
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
                            onClick={() => setDeletePassword('')}
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
                </div>
              </CardContent>
            </Card>
          </section>

          <section
            role="tabpanel"
            id="account-panel-notifications"
            aria-labelledby="account-tab-notifications"
            tabIndex={0}
            hidden={activeTab !== 'notifications'}
            className="min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-in motion-safe:fade-in-0"
          >
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
          </section>
        </div>
      </div>
    </div>
  )
}
