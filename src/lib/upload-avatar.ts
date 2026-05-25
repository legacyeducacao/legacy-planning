import { getSupabase } from "@/lib/supabase"

const BUCKET = "avatars"

/**
 * Faz upload de uma imagem pra o bucket de avatars no Supabase Storage.
 * Caminho: avatars/{uid}/{timestamp}.{ext}
 * Bucket é Public, então a URL retornada é acessível direto pelo browser.
 */
export async function uploadAvatar(
  file: File,
  uid: string,
): Promise<{ url: string; path: string }> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Arquivo precisa ser uma imagem")
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Imagem precisa ter no máximo 5MB")
  }

  const supabase = getSupabase()
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const path = `${uid}/${Date.now()}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })
  if (error) throw new Error(`Supabase upload falhou: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}
