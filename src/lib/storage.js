import { supabase } from './supabase'

const STORAGE_BUCKET = 'avatars'
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024
const HEADER_BYTES_TO_CHECK = 12

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
  const normalized = String(folder || '').trim().toLowerCase() || 'general'
  return ALLOWED_FOLDERS.has(normalized) ? normalized : 'general'
}

function isBrowserFile(file) {
  return typeof File !== 'undefined' && file instanceof File
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    String(value || ''),
  )
}

function bytesStartWith(bytes, signature) {
  return signature.every((byte, index) => bytes[index] === byte)
}

function bytesToAscii(bytes, start, end) {
  return Array.from(bytes.slice(start, end))
    .map((byte) => String.fromCharCode(byte))
    .join('')
}

function hasValidImageSignature(fileType, bytes) {
  if (!bytes || bytes.length < 4) return false

  if (fileType === 'image/jpeg') {
    return bytesStartWith(bytes, [0xff, 0xd8, 0xff])
  }

  if (fileType === 'image/png') {
    return bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  }

  if (fileType === 'image/gif') {
    const header = bytesToAscii(bytes, 0, 6)
    return header === 'GIF87a' || header === 'GIF89a'
  }

  if (fileType === 'image/webp') {
    const riff = bytesToAscii(bytes, 0, 4)
    const webp = bytesToAscii(bytes, 8, 12)
    return riff === 'RIFF' && webp === 'WEBP'
  }

  return false
}

async function readFileHeader(file) {
  const buffer = await file.slice(0, HEADER_BYTES_TO_CHECK).arrayBuffer()
  return new Uint8Array(buffer)
}

async function validateImageFile(file) {
  if (!file) {
    return 'No file selected.'
  }

  if (!isBrowserFile(file)) {
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

  try {
    const headerBytes = await readFileHeader(file)

    if (!hasValidImageSignature(file.type, headerBytes)) {
      return 'The selected file does not match its declared image type.'
    }
  } catch {
    return 'Could not inspect the selected image.'
  }

  return ''
}

function buildStoragePath({ userId, folder, file }) {
  if (!isValidUuid(userId)) {
    throw new Error('Invalid authenticated user.')
  }

  const safeFolder = sanitizeFolder(folder)
  const extension = EXTENSION_BY_TYPE[file.type]

  if (!extension) {
    throw new Error('Unsupported image type.')
  }

  return `${userId}/${safeFolder}/${crypto.randomUUID()}.${extension}`
}

export async function uploadImageToAvatars(file, folder = 'general') {
  const validationError = await validateImageFile(file)

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

  let fileName = ''

  try {
    fileName = buildStoragePath({
      userId: user.id,
      folder,
      file,
    })
  } catch (error) {
    return { data: null, error }
  }

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(fileName, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { data: null, error: uploadError }
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName)

  if (!data?.publicUrl) {
    return {
      data: null,
      error: new Error('Could not create a public URL for the uploaded image.'),
    }
  }

  return {
    data: {
      path: fileName,
      publicUrl: data.publicUrl,
    },
    error: null,
  }
}
