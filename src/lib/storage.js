import { supabase } from './supabase'

export async function uploadImageToAvatars(file, folder = 'general') {
  if (!file) {
    return { data: null, error: new Error('No file selected.') }
  }

  const safeFolder = folder || 'general'
  const fileExt = file.name?.split('.').pop()?.toLowerCase() || 'png'
  const fileName = `${safeFolder}/${crypto.randomUUID()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
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
