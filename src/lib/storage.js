import { supabase } from './supabase'

const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const EXTENSION_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const ALLOWED_FOLDERS = new Set(['avatars', 'images', 'general'])

function sanitizeFolder(folder) {
  const normalized = folder?.trim().toLowerCase() || 'general'
  return ALLOWED_FOLDERS.has(normalized) ? normalized : 'general'
}

function validateImageFile(file) {
  if (!file) {
    return 'No file selected.'
  }

  if (!(file instanceof File)) {
    return 'Invalid file input.'
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Only JPG, PNG, WebP, or GIF images are allowed.'
  }

  if (file.size <= 0) {
    return 'Selected file is empty.'
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image must be 4 MB or smaller.'
  }

  return ''
}

function buildStoragePath({ userId, folder, file }) {
  const safeFolder = sanitizeFolder(folder)
  const extension = EXTENSION_BY_TYPE[file.type] || 'jpg'

  return `${userId}/${safeFolder}/${crypto.randomUUID()}.${extension}`
}

export async function uploadImageToAvatars(file, folder = 'general') {
  const validationError = validateImageFile(file)

  if (validationError) {
    return { data: null, error: new Error(validationError) }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { data: null, error: userError }
  }

  if (!user?.id) {
    return { data: null, error: new Error('You must be signed in to upload images.') }
  }

  const fileName = buildStoragePath({
    userId: user.id,
    folder,
    file,
  })

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { data: null, error: uploadError }
  }

  const { data } = supabase.storage.from('avatars').getPublicUrl(fileName)

  return {
    data: {
      path: fileName,
      publicUrl: data.publicUrl,
    },
    error: null,
  }
}
