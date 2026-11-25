import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSeo } from '@/hooks/useSeo'

export function Privacy() {
  useSeo({
    title: 'Privacy Policy — Tofik Store',
    description:
      'What personal information Tofik Store collects, how it is used, and your rights.',
    path: '/privacy',
  })

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-4 sm:py-10 lg:px-8">
      <Card>
        <CardHeader className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              Privacy policy
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Effective date: November 2026 · Tofik Store
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="flex gap-3 text-sm text-muted-foreground">
            <Shield className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <p>
              This privacy policy explains what personal information Tofik
              Store collects when you use the website or the Android app, how
              we use it, and your choices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">1. Information we collect</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Account details:</strong> name, phone number, and email
                address you provide when you sign up or update your account.
              </li>
              <li>
                <strong>Orders:</strong> items ordered, totals, delivery
                address, and order status history tied to your account.
              </li>
              <li>
                <strong>Cart:</strong> items you add to your cart while signed
                in.
              </li>
              <li>
                <strong>Device and network info:</strong> IP address, device
                type, and connection status used to keep the service running and
                secure. The app may show an offline banner when you lose
                connection.
              </li>
              <li>
                <strong>Push notification token:</strong> if you turn on
                notifications in the Android app, a device token used to
                deliver order alerts to your device. It is deleted when you
                turn notifications off, sign out, or delete your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">2. How we use your information</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>To let you sign in with your phone number or email.</li>
              <li>To process and confirm your orders and notify you of status changes, including push alerts if you turn them on.</li>
              <li>To keep your cart and account details synced across devices.</li>
              <li>To operate, maintain, and improve the shop.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">3. Sharing and processors</h2>
            <p className="text-sm text-muted-foreground">
              We do not sell your personal information. Your account and order
              data is stored on Supabase, which acts as our data processor. If
              you turn on push notifications in the Android app, the device
              token and the alert text are sent through Google Firebase Cloud
              Messaging, which acts as a processor for that purpose. We only
              share information when required to complete an order or as
              required by law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">4. Retention</h2>
            <p className="text-sm text-muted-foreground">
              We keep account details while your account is active. You can
              delete your account at any time from the Account page or{' '}
              <Link to="/delete-account">on the web</Link>; your order history
              is retained with personal details removed so the shop can keep
              sales records.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">5. Your rights</h2>
            <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
              <li>View, edit, or delete your account details from the Account page.</li>
              <li>Request a copy or deletion of your data by contacting us.</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold tracking-tight">6. Contact</h2>
            <p className="text-sm text-muted-foreground">
              Questions about this policy or your data? Contact Tofik Store at{' '}
              <a href="mailto:privacy@tofik.store" className="text-primary hover:underline">
                privacy@tofik.store
              </a>
              .
            </p>
          </section>
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Tofik Store</p>
      </div>
    </div>
  )
}
