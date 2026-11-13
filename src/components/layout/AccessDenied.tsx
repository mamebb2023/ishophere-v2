import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function AccessDenied({
  title,
  description,
  backTo = '/stores',
  backLabel = 'Browse stores',
  switchAccountTo = '/admin/login',
}: {
  title: string
  description: string
  backTo?: string
  backLabel?: string
  switchAccountTo?: string
}) {
  return (
    <div className="flex min-h-dvh flex-col overflow-y-auto bg-muted/40 px-4 py-10">
      <div className="m-auto w-full max-w-md">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <ShieldAlert className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <Button asChild>
                <Link to={backTo}>{backLabel}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to={switchAccountTo}>Use another account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
