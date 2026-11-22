import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  BadgeCheck,
  Download as DownloadIcon,
  ShieldCheck,
  Smartphone,
  Wifi,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useSeo } from '@/hooks/useSeo'
import { useSettings } from '@/hooks/useSettings'

const APP_VERSION = '1.0.0'
const APK_SIZE = '3.7 MB'
const APK_URL =
  'https://github.com/mamebb2023/ishophere-v2/releases/download/android-v1.0.0/TofikStore-1.0.0.apk'
const RELEASE_URL =
  'https://github.com/mamebb2023/ishophere-v2/releases/tag/android-v1.0.0'

const installSteps = [
  'Tap Download APK and wait for the download to finish.',
  'Open the file from your notifications or Files app.',
  'If prompted, allow installs from your browser, then tap Install.',
]

const requirements = [
  {
    icon: Wifi,
    text: 'An internet connection is required because the app loads the live shop.',
  },
  {
    icon: ShieldCheck,
    text: 'Android may ask you to allow installs from your browser. This is normal for apps installed outside Google Play.',
  },
  {
    icon: BadgeCheck,
    text: 'Your cart, orders, and account stay in sync with the website.',
  },
]

export function Download() {
  const { settings } = useSettings()

  useSeo({
    title: 'Download the Android app',
    description: `Download ${settings.shop_name} for Android. Browse products, check live stock, and check out from your phone.`,
    path: '/download',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'MobileApplication',
      name: `${settings.shop_name} for Android`,
      operatingSystem: 'Android 7.0+',
      applicationCategory: 'ShoppingApplication',
      downloadUrl: APK_URL,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'SAR',
      },
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-4 sm:py-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/">
            <ArrowLeft />
            Back to shop
          </Link>
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 shadow-sm sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-primary/5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 left-1/4 size-48 rounded-full bg-primary/5"
        />
        <div className="relative grid gap-8 md:grid-cols-[1.25fr_0.75fr] md:items-center">
          <div>
            <Badge variant="success" className="mb-4">
              Android app
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Get {settings.shop_name} on your phone
            </h1>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Install the Android app for a faster way to browse products,
              check live stock, and check out. The app stays up to date with the
              live shop.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <a href={APK_URL} target="_blank" rel="noreferrer">
                  <DownloadIcon />
                  Download APK
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/">Keep shopping</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Version {APP_VERSION} · {APK_SIZE} · Android 7.0+ · Internet
              required
            </p>
          </div>
          <div className="flex justify-center md:justify-end">
            <img
              src="/icon-192.png"
              alt={`${settings.shop_name} app icon`}
              className="size-36 rounded-[2rem] shadow-xl sm:size-44"
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="size-5 text-primary" />
              How to install
            </CardTitle>
            <CardDescription>Three quick steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {installSteps.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Before you install
            </CardTitle>
            <CardDescription>What to expect.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {requirements.map(({ icon: Icon, text }) => (
                <li key={text} className="flex gap-3">
                  <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col items-start gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="font-medium">On iPhone or iPad?</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              Open{' '}
              <span className="font-medium text-foreground">tofik.store</span>{' '}
              in Safari, tap the Share button, then choose{' '}
              <span className="font-medium text-foreground">
                Add to Home Screen
              </span>
              .
            </p>
          </div>
          <div className="flex items-center gap-3">
            <img
              src="/download-qr.png"
              alt="QR code for the download page"
              className="size-28 rounded-xl border bg-white p-1.5"
            />
            <p className="max-w-24 text-xs text-muted-foreground">
              Scan to open this page on your phone
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        This build is distributed outside Google Play. If Android shows a
        warning, choose{' '}
        <span className="font-medium text-foreground">Install anyway</span>. You
        can remove the app at any time from Settings. See the{' '}
        <a
          href={RELEASE_URL}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          release notes
        </a>
        .
      </p>
    </div>
  )
}
