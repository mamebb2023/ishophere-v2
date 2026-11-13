import { supabase } from '@/lib/supabase'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export function validateImage(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Use a JPG, PNG, WebP, or AVIF image.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'Images must be 5 MB or smaller.'
  }
  return null
}

export async function uploadItemImage(file: File): Promise<string> {
  const validationError = validateImage(file)
  if (validationError) throw new Error(validationError)

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `items/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage
    .from('item-images')
    .upload(path, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (error) throw error

  const { data } = supabase.storage.from('item-images').getPublicUrl(path)
  return data.publicUrl
}

export async function deleteItemImage(url: string | null): Promise<void> {
  if (!url) return
  const marker = '/item-images/'
  const index = url.indexOf(marker)
  if (index === -1) return
  const path = decodeURIComponent(url.slice(index + marker.length).split('?')[0])
  await supabase.storage.from('item-images').remove([path])
}
