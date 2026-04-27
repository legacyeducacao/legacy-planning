import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage"
import { getStorage } from "./firebase"

// Generate a unique filename with timestamp and random string
const generateUniqueFilename = (originalName: string) => {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 8)
  const fileExtension = originalName.split(".").pop()
  return `audio_${timestamp}_${randomString}.${fileExtension}`
}

// Upload audio file to Firebase Storage
// Note: All files are uploaded to Firebase (no base64 encoding)
export const uploadLargeFile = async (
  file: File,
): Promise<{ url: string; path: string }> => {
  try {
    // Create a unique filename to avoid collisions
    const filename = generateUniqueFilename(file.name)
    const filePath = `temp_audio/${filename}`
    const storageRef = ref(getStorage(), filePath)

    try {
      await uploadBytes(storageRef, file)
    } catch (uploadError) {
      console.error("Firebase uploadBytes error:", uploadError)
      throw uploadError
    }

    let downloadURL
    try {
      downloadURL = await getDownloadURL(storageRef)
    } catch (urlError) {
      console.error("Firebase getDownloadURL error:", urlError)
      throw urlError
    }

    return { url: downloadURL, path: filePath }
  } catch (error: unknown) {
    console.error("Error uploading file to Firebase:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to upload audio file: ${errorMessage}`)
  }
}

export const deleteFile = async (path: string): Promise<void> => {
  try {
    // Check if we got a full URL or just a path
    let filePath = path

    // If it's a URL, try to extract the path
    if (path.startsWith("http")) {
      // Try to convert URL to storage path - this is tricky and implementation depends on URL format
      // For simplicity, if path contains 'temp_audio/', extract that part and everything after
      const match = path.match(/temp_audio\/.+/)
      if (match) {
        filePath = match[0]
      } else {
        console.warn("Could not extract file path from URL, using as-is:", path)
      }
    }

    // Create a reference to the file
    const fileRef = ref(getStorage(), filePath)

    // Delete the file
    await deleteObject(fileRef)
  } catch (error) {
    console.error("Error deleting file from Firebase:", error)
    // Continue even if deletion fails (we'll rely on Firebase lifecycle rules as backup)
  }
}
