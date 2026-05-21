import { getDownloadURL, ref, uploadBytes } from "firebase/storage"
import { getStorage } from "@/lib/firebase"

const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now()
  const randomBytes = new Uint8Array(4)
  crypto.getRandomValues(randomBytes)
  const randomString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
  const fileExtension = originalName?.split(".").pop() || "audio"
  return `audio_${timestamp}_${randomString}.${fileExtension}`
}

/**
 * Uploads a File diretamente pro Firebase Storage.
 * Evita o gargalo da Netlify Function (~6MB body limit) — o cliente fala
 * direto com o Storage, depois manda a URL pro /api/transcribe.
 *
 * @param file - File do input/dropzone
 * @param onProgress - opcional, chamado com 0..1 enquanto sobe
 */
export async function uploadFileToFirebase(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<{ url: string; path: string }> {
  const storageInstance = getStorage()
  const filename = generateUniqueFilename(file.name)
  const filePath = `temp_audio/${filename}`
  const fileRef = ref(storageInstance, filePath)

  console.log(
    `Uploading file "${file.name}" (${(file.size / 1024 / 1024).toFixed(2)} MB) → Firebase ${filePath}`,
  )

  // uploadBytes não emite progress; chamamos 0 e 1 manualmente. Pra progress
  // real, migrar pra uploadBytesResumable (state_changed).
  onProgress?.(0)
  const snapshot = await uploadBytes(fileRef, file, {
    contentType: file.type || "application/octet-stream",
  })
  onProgress?.(1)

  const downloadURL = await getDownloadURL(snapshot.ref)
  return { url: downloadURL, path: filePath }
}

/**
 * Uploads base64 encoded data to Firebase Storage.
 * @param {string} base64Data - The base64 encoded data string (with or without prefix).
 * @param {string} [mimeType='audio/mpeg'] - The MIME type of the data.
 * @returns {Promise<{url: string, path: string}>} - Resolves with the download URL and storage path.
 */
export async function uploadBase64ToFirebase(
  base64Data: string,
  mimeType: string = "audio/mpeg",
): Promise<{ url: string; path: string }> {
  try {
    const storageInstance = getStorage()
    const base64WithoutPrefix = base64Data.replace(/^data:.*;base64,/, "")

    // Decode base64 string to Uint8Array
    const byteCharacters = atob(base64WithoutPrefix)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.codePointAt(i) ?? 0
    }
    const byteArray = new Uint8Array(byteNumbers)

    const blob = new Blob([byteArray], { type: mimeType })

    const filename = generateUniqueFilename("upload")
    const filePath = `temp_audio/${filename}` // Consider making the folder configurable
    const fileRef = ref(storageInstance, filePath)

    console.log(
      `Uploading blob (${(blob.size / 1024 / 1024).toFixed(2)} MB) to Firebase path: ${filePath}`,
    )
    const snapshot = await uploadBytes(fileRef, blob)
    console.log("Upload successful:", snapshot.metadata.fullPath)

    const downloadURL = await getDownloadURL(snapshot.ref)
    console.log("Firebase upload complete, download URL obtained")

    return { url: downloadURL, path: filePath }
  } catch (error: unknown) {
    console.error("Firebase upload error:", error)
    // Enhance error reporting
    const errorMessage =
      error instanceof Error ? error.message : "Unknown Firebase upload error"
    const errorCode = (error as { code?: string }).code || "N/A"
    throw new Error(
      `Firebase upload failed (Code: ${errorCode}): ${errorMessage}`,
    )
  }
}
