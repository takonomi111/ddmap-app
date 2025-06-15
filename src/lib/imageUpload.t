import { supabase } from './supabase'

export async function uploadTileImage(tileName: string, file: File) {
  const filePath = `${tileName}/${Date.now()}-${file.name}`

  const { data, error } = await supabase.storage
    .from('tile-images') // 君のバケット名
    .upload(filePath, file)

  if (error) {
    console.error('Upload error:', error)
    throw new Error('Upload failed')
  }

  const { data: publicUrlData } = supabase.storage
    .from('tile-images')
    .getPublicUrl(filePath)

  return {
    url: publicUrlData.publicUrl,
    path: filePath,
  }
}
