import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RequireAuth } from '@/components/layout/RequireAuth'
import { useAuth } from '@/hooks/useAuth'
import { useSeo } from '@/hooks/useSeo'
import { getErrorMessage } from '@/lib/format'
import { useState } from 'react'

export function DeleteAccountPage() {
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)
  const [password, setPassword] = useState('')

  useSeo({
    title: 'Delete your account — Tofik Store',
    description: 'Request deletion of your Tofik Store account.',
    path: '/delete-account',
    noIndex: true,
  })

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!password) {
      toast.error('Enter your current password')
      return
    }
    setDeleting(true)
    try {
      await deleteAccount(password)
      toast.success('Account deleted')
      navigate('/')
    } catch (error) {
      toast.error(getErrorMessage(error))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6 py-4 sm:py-10">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link to="/account">
              <ArrowLeft />
              Back to account
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
              Delete your account
            </CardTitle>
            <CardDescription>
              This permanently removes your name, phone number, email address,
              and profile. Your order history is kept with personal details
              removed so the shop can retain sales records. This cannot be
              undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="delete-account-password">Current password</Label>
                <Input
                  id="delete-account-password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Confirm it's you"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Deleting your account also signs you out everywhere.
              </p>
              <Button type="submit" disabled={deleting} className="w-full">
                {deleting ? 'Deleting...' : 'Delete account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </RequireAuth>
  )
}
