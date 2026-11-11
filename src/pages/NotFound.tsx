import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Button } from '@/components/ui/button'

export function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 py-10">
      <EmptyState
        icon={Compass}
        title="Page not found"
        description="The page you are looking for does not exist or has moved."
        action={
          <Button asChild>
            <Link to="/">Back to shop</Link>
          </Button>
        }
      />
    </div>
  )
}
