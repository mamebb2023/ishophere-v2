import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BellRing,
  LayoutDashboard,
  LogOut,
  Mail,
  Pencil,
  Phone,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { NotificationPreferences } from '@/components/NotificationPreferences'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/useAuth'
import { useSeo } from '@/hooks/useSeo'
import { formatDate, getErrorMessage } from '@/lib/format'
import { formatPhoneNumber, isValidPhone } from '@/lib/phone'
import {
  getUserDisplayName,
  getUserEmail,
  getUserIdentifier,
  getUserName,
  getUserPhone,
} from '@/lib/user'

export function Account() {
  const { user, profile, profileLoading, isAdmin, signOut, updateProfile, addEmail, changePassword } =
    useAuth()
  const navigate = useNavigate()
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

  useSeo({
    title: 'Your account',
    description:
      'Manage your Tofik Store name, email, and phone number.',
    path: '/account',
    noIndex: true,
  })

  const displayName = getUserDisplayName(user, profile)
  const identifier = getUserIdentifier(user, profile)
  const accountName = getUserName(user, profile)
  const accountPhone = getUserPhone(user, profile)
  const accountEmail = getUserEmail(user, profile)

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
      setChangingPassword(false)
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

  function cancelNameEdit() {
    setEditingName(false)
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
    setChangingPassword(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            My account
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your details and notifications.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
          <LogOut />
          Sign out
        </Button>
      </div>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UserRound className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{displayName}</CardTitle>
            {identifier && identifier !== displayName ? (
              <p className="truncate text-xs text-muted-foreground">{identifier}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {isAdmin ? 'Shop owner' : 'Customer'}
              {user?.created_at ? ` · Joined ${formatDate(user.created_at)}` : ''}
            </p>
          </div>
        </CardHeader>
        {isAdmin ? (
          <CardContent>
            <Button asChild size="sm">
              <Link to="/admin">
                <LayoutDashboard />
                Admin dashboard
              </Link>
            </Button>
          </CardContent>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact details</CardTitle>
        </CardHeader>
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
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Name
                    </p>
                    <p className="truncate text-sm font-semibold">
                      {accountName || 'Not added'}
                    </p>
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
                  <div className="mt-3 flex flex-col gap-2 sm:max-w-sm">
                    <Label htmlFor="account-name">Name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="account-name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                      />
                      <Button
                        type="button"
                        onClick={() => void handleSaveName()}
                        disabled={savingName}
                      >
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
                  </div>
                ) : null}
              </div>

              <div className="border-b py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Phone
                      </p>
                      <p className="truncate text-sm font-semibold">
                        {accountPhone ? formatPhoneNumber(accountPhone) : 'Not added'}
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
                  <div className="mt-3 flex flex-col gap-2">
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
                        type="button"
                        onClick={() => void handleSavePhone()}
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
                  </div>
                ) : null}
              </div>

              <div className="pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
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
                      <Label htmlFor="account-email-password">Current password</Label>
                      <Input
                        id="account-email-password"
                        type="password"
                        autoComplete="current-password"
                        placeholder="Confirm it's you"
                        value={emailPassword}
                        onChange={(event) => setEmailPassword(event.target.value)}
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

      <Card>
        <CardHeader className="flex-row items-center gap-2 space-y-0">
          <BellRing className="h-5 w-5 text-primary" />
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationPreferences />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:max-w-sm">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-current-password">Current password</Label>
            <Input
              id="account-current-password"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
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
            <Label htmlFor="account-confirm-new-password">Confirm new password</Label>
            <Input
              id="account-confirm-new-password"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(event) => setConfirmNewPassword(event.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => void handleSavePassword()}
              disabled={changingPassword}
            >
              {changingPassword ? <Spinner /> : null}
              Change password
            </Button>
            <Button type="button" variant="outline" onClick={cancelPasswordEdit} disabled={changingPassword}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
