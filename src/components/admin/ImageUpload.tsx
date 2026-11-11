import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { ImagePlus, Package, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { validateImage } from '@/lib/storage'
import { cn } from '@/lib/utils'

export function ImageUpload({
  currentUrl,
  onFileSelected,
}: {
  currentUrl: string | null
  onFileSelected: (file: File | null) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    const validationError = validateImage(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    setFileName(file.name)
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return URL.createObjectURL(file)
    })
    onFileSelected(file)
  }

  function clearSelection() {
    setPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return null
    })
    setFileName(null)
    setError(null)
    onFileSelected(null)
  }

  const displayUrl = preview ?? currentUrl

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          'relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl border-2 border-dashed bg-muted/40',
          displayUrl && 'border-solid',
        )}
      >
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Item preview"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center text-muted-foreground">
            <Package className="h-8 w-8" />
            <p className="text-sm font-medium">No image selected</p>
            <p className="text-xs">JPG, PNG, WebP, or AVIF · max 5 MB</p>
          </div>
        )}
        {displayUrl ? (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
            {fileName ?? 'Current image'}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus />
          {displayUrl ? 'Replace image' : 'Choose image'}
        </Button>
        {preview ? (
          <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
            <X />
            Clear selection
          </Button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="sr-only"
        onChange={handleChange}
      />

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
