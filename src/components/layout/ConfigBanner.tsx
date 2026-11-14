import { Link } from 'react-router-dom'
import { Settings2, Database } from 'lucide-react'
import { isSupabaseConfigured } from '@/lib/supabase'

export function ConfigBanner() {
  if (isSupabaseConfigured) return null

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
      <div className="mx-auto flex max-w-6xl items-start gap-3 text-sm">
        <Database className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 break-words">
          <p className="font-semibold">Supabase is not configured</p>
          <p className="mt-0.5 text-amber-800 [overflow-wrap:anywhere]">
            Copy <code className="rounded bg-amber-100 px-1">.env.example</code> to{' '}
            <code className="rounded bg-amber-100 px-1">.env.local</code>, add your
            project URL and anon key, then run{' '}
            <code className="rounded bg-amber-100 px-1">
              supabase/migrations/*.sql
            </code>{' '}
            in order. Then run <code className="rounded bg-amber-100 px-1">
              npm run seed:dev
            </code>{' '}
            to create the dev owner.
          </p>
        </div>
        <Link
          to="/admin/login"
          className="ml-auto hidden items-center gap-1 text-xs font-semibold underline sm:flex"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Setup
        </Link>
      </div>
    </div>
  )
}
