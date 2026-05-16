import { type FirebaseApp, getApps, initializeApp } from "firebase/app"
import { type Auth, getAuth } from "firebase/auth"
import { type Firestore, getFirestore } from "firebase/firestore"
import { type FirebaseStorage, getStorage } from "firebase/storage"

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
let auth: Auth
let firestore: Firestore

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

const getFirebaseAuth = (): Auth => {
  if (!auth) {
    auth = getAuth(getApp())
  }
  return auth
}

const getFirebaseFirestore = (): Firestore => {
  if (!firestore) {
    firestore = getFirestore(getApp())
  }
  return firestore
}

export {
  getApp,
  getFirebaseAuth as getAuth,
  getFirebaseFirestore as getFirestore,
  getFirebaseStorage as getStorage,
}
export const getFirebaseConfig = () => firebaseConfig
