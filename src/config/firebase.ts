import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  appId: string | undefined;
}

// Initialize Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate required config
const requiredFields = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'appId',
] as const;

const missingFields = requiredFields.filter(
  (field) => !firebaseConfig[field]
);

if (missingFields.length > 0) {
  throw new Error(
    `Missing required Firebase config fields: ${missingFields.join(', ')}`
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Initialize Analytics if supported
const initAnalytics = async () => {
  try {
    if (await isSupported()) {
      const analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
      return analytics;
    }
  } catch (error) {
    console.warn('Firebase Analytics not supported in this environment:', error);
  }
  return null;
};

// Initialize analytics in the background
initAnalytics();

export { auth, db, storage };
export default app; 