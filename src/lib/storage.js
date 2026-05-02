import { supabase } from './supabase'

const AVATARS_BUCKET = 'avatars'
const SHOP_PRODUCTS_BUCKET = 'shop-products'
const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024
const HEADER_BYTES_TO_CHECK = 12
const SHOP_PRODUCT_IMAGE_SIZE = 1200
const SHOP_PRODUCT_IMAGE_QUALITY = 0.86

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

const ALLOWED_FOLDERS = new Set([
  'avatars',
  'images',
  'general',
  'products',
  'collectibles',
  'shop',
])

function sanitizeFolder(folder) {
  const normalized = String(folder || '').trim().toLowerCase() || 'general'
  return ALLOWED_FOLDERS.has(normalized) ? normalized : 'general'
}

function isBrowserFile(file) {
  return typeof File !== 'undefined' && file instanceof File
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
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

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob)
      },
      type,
      quality,
    )
  })
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Could not load the selected image.'))
    }

    image.src = objectUrl
  })
}

function drawContainedImage(ctx, image, canvasSize) {
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height

  const scale = Math.min(canvasSize / sourceWidth, canvasSize / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const drawX = (canvasSize - drawWidth) / 2
  const drawY = (canvasSize - drawHeight) / 2

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

function drawCoverImage(ctx, image, canvasSize) {
  const sourceWidth = image.naturalWidth || image.width
  const sourceHeight = image.naturalHeight || image.height

  const scale = Math.max(canvasSize / sourceWidth, canvasSize / sourceHeight)
  const drawWidth = sourceWidth * scale
  const drawHeight = sourceHeight * scale
  const drawX = (canvasSize - drawWidth) / 2
  const drawY = (canvasSize - drawHeight) / 2

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight)
}

async function prepareSquareShopProductImage(file) {
  const image = await loadImageFromFile(file)

  const canvas = document.createElement('canvas')
  canvas.width = SHOP_PRODUCT_IMAGE_SIZE
  canvas.height = SHOP_PRODUCT_IMAGE_SIZE

  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('Could not prepare the product image.')
  }

  // Background: fill the square with a blurred cover version of the same image.
  ctx.save()
  ctx.filter = 'blur(28px)'
  drawCoverImage(ctx, image, SHOP_PRODUCT_IMAGE_SIZE)
  ctx.restore()

  // Dark overlay keeps product cards visually consistent with the Dresscode UI.
  ctx.fillStyle = 'rgba(8, 24, 24, 0.42)'
  ctx.fillRect(0, 0, SHOP_PRODUCT_IMAGE_SIZE, SHOP_PRODUCT_IMAGE_SIZE)

  // Foreground: keep the original image fully visible and centered.
  drawContainedImage(ctx, image, SHOP_PRODUCT_IMAGE_SIZE)

  const blob = await canvasToBlob(
    canvas,
    'image/webp',
    SHOP_PRODUCT_IMAGE_QUALITY,
  )

  if (!blob) {
    throw new Error('Could not convert the product image to WebP.')
  }

  if (blob.size <= 0) {
    throw new Error('Prepared product image is empty.')
  }

  if (blob.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error('Prepared product image is larger than 4 MB.')
  }

  return new File([blob], 'shop-product-image.webp', {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}

async function uploadValidatedImage({ file, bucket, folder = 'general' }) {
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
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    return { data: null, error: uploadError }
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)

  if (!data?.publicUrl) {
    return {
      data: null,
      error: new Error('Could not create a public URL for the uploaded image.'),
    }
  }

  return {
    data: {
      bucket,
      path: fileName,
      publicUrl: data.publicUrl,
    },
    error: null,
  }
}

export async function uploadImageToAvatars(file, folder = 'general') {
  return uploadValidatedImage({
    file,
    bucket: AVATARS_BUCKET,
    folder,
  })
}

export async function uploadShopProductImage(file, folder = 'products') {
  const validationError = await validateImageFile(file)

  if (validationError) {
    return { data: null, error: new Error(validationError) }
  }

  let preparedFile = null

  try {
    preparedFile = await prepareSquareShopProductImage(file)
  } catch (error) {
    return { data: null, error }
  }

  return uploadValidatedImage({
    file: preparedFile,
    bucket: SHOP_PRODUCTS_BUCKET,
    folder,
  })
}
