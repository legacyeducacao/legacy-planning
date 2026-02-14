import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let storage: FirebaseStorage

const getApp = (): FirebaseApp => {
  if (!app) {
    const existing = getApps()
    app = existing.length > 0 ? existing[0] : initializeApp(firebaseConfig)
  }
  return app
}

const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    storage = getStorage(getApp())
  }
  return storage
}

export { getFirebaseStorage as getStorage, getApp }
export const getFirebaseConfig = () => firebaseConfig
