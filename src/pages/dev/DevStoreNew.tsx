import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, ArrowRight, Store as StoreIcon, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { getErrorMessage } from '@/lib/format'
import { slugify } from '@/lib/slug'
import { supabase } from '@/lib/supabase'
import type { Store } from '@/lib/types'

const storeSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Store name must be at least 2 characters')
    .max(80, 'Store name is too long'),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(60, 'Slug is too long')
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens',
    ),
  description: z
    .string()
    .trim()
    .min(2, 'Add a short description')
    .max(500, 'Description is too long'),
  owner_name: z
    .string()
    .trim()
    .min(2, 'Owner name must be at least 2 characters')
    .max(120, 'Owner name is too long'),
  owner_email: z.string().trim().email('Enter a valid owner email'),
})

type StoreFormValues = z.infer<typeof storeSchema>

export function DevStoreNew() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [slugEdited, setSlugEdited] = useState(false)
  const [slugPreview, setSlugPreview] = useState('')

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      owner_name: '',
      owner_email: '',
    },
  })

  const nameField = register('name')
  const slugField = register('slug', {
    onChange: () => setSlugEdited(true),
  })

  async function onSubmit(values: StoreFormValues) {
    setSubmitting(true)
    setError(null)
    try {
      const { data, error: rpcError } = await supabase.rpc('create_store', {
        p_name: values.name.trim(),
        p_slug: values.slug.trim().toLowerCase(),
        p_description: values.description.trim(),
        p_owner_name: values.owner_name.trim(),
        p_owner_email: values.owner_email.trim().toLowerCase(),
      })

      if (rpcError) throw rpcError
      const created = data as Store | null
      toast.success(`${created?.name ?? values.name.trim()} created`)
      navigate('/dev/stores')
    } catch (submitError) {
      const message = getErrorMessage(submitError)
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <Link
        to="/dev/stores"
        className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to stores
      </Link>

      <div>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          Create a store
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The store opens immediately at its public address. The owner can sign
          in with their existing iShopHere account.
        </p>
      </div>

      {error ? (
        <Alert variant="error" title="Could not create the store">
          <p>{error}</p>
        </Alert>
      ) : null}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid gap-6 lg:grid-cols-[1fr_340px]"
      >
        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <StoreIcon className="h-5 w-5 text-primary" />
            <CardTitle>Store details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="store-name">Store name</Label>
              <Input
                id="store-name"
                placeholder="e.g. Corner Bakery"
                autoComplete="organization"
                {...nameField}
                onChange={(event) => {
                  nameField.onChange(event)
                  if (!slugEdited) {
                    const nextSlug = slugify(event.target.value).slice(0, 60)
                    setSlugPreview(nextSlug)
                    setValue('slug', nextSlug, { shouldValidate: false })
                  }
                }}
              />
              {errors.name ? (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="store-slug">Store slug</Label>
              <div className="flex items-center rounded-lg border border-input bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                <span className="border-r px-3 py-2 text-sm text-muted-foreground">
                  /s/
                </span>
                <input
                  id="store-slug"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="corner-bakery"
                  className="h-10 w-full rounded-r-lg bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground sm:text-sm"
                  {...slugField}
                  onChange={(event) => {
                    slugField.onChange(event)
                    setSlugPreview(event.target.value)
                  }}
                />
              </div>
              {errors.slug ? (
                <p className="text-sm text-destructive">{errors.slug.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Public address: /s/{slugPreview || 'your-store'} · Lowercase
                  letters, numbers, and hyphens.
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="store-description">Description</Label>
              <Textarea
                id="store-description"
                rows={5}
                maxLength={500}
                placeholder="What does this store sell?"
                {...register('description')}
              />
              {errors.description ? (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Shown in the storefront hero and the public store directory.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center gap-2 space-y-0">
              <UserRound className="h-5 w-5 text-primary" />
              <CardTitle>Owner</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="owner-name">Owner name</Label>
                <Input
                  id="owner-name"
                  placeholder="e.g. Amina Yusuf"
                  autoComplete="name"
                  {...register('owner_name')}
                />
                {errors.owner_name ? (
                  <p className="text-sm text-destructive">
                    {errors.owner_name.message}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="owner-email">Owner email</Label>
                <Input
                  id="owner-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="owner@example.com"
                  {...register('owner_email')}
                />
                {errors.owner_email ? (
                  <p className="text-sm text-destructive">
                    {errors.owner_email.message}
                  </p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  The email must already belong to an iShopHere account. Ask the
                  owner to sign up at <span className="font-mono">/auth</span>{' '}
                  first.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-col gap-3 p-5 sm:p-6">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? <Spinner /> : <ArrowRight />}
                {submitting ? 'Creating…' : 'Create store'}
              </Button>
              <Button asChild variant="outline" type="button">
                <Link to="/dev/stores">Cancel</Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                The owner can manage the store, items, and categories after
                signing in.
              </p>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}
