const STORAGE_PUBLIC_PREFIX = '/storage/v1/object/public'

// getStoragePublicUrl - convert a storage path into a public file url
export function getStoragePublicUrl(bucket: string, path: string | null) {
  if (!path) {
    return null
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!url) {
    return path
  }

  return `${url}${STORAGE_PUBLIC_PREFIX}/${bucket}/${path}`
}
