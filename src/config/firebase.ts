import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

interface FirebaseConfig {
  apiKey: string | undefined;
  authDomain: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
  measurementId?: string | undefined;
}

// Initialize Firebase configuration
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase configuration
const validateConfig = () => {
  const requiredFields = [
    'apiKey',
    'authDomain',
    'projectId',
    'messagingSenderId',
    'appId'
  ] as const;

  const missingFields = requiredFields.filter(field => !firebaseConfig[field]);
  
  if (missingFields.length > 0) {
    throw new Error(
      `Missing required Firebase configuration fields: ${missingFields.join(', ')}. ` +
      'Please check your .env file and ensure all required fields are set.'
    );
  }

  // Log configuration status (without sensitive values)
  console.log('Firebase Config Status:', {
    hasApiKey: !!firebaseConfig.apiKey,
    authDomain: firebaseConfig.authDomain,
    projectId: firebaseConfig.projectId,
    hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
    hasAppId: !!firebaseConfig.appId,
    hasMeasurementId: !!firebaseConfig.measurementId
  });
};

// Initialize Firebase services
const initializeFirebase = () => {
  validateConfig();
  
  try {
    const app = initializeApp(firebaseConfig as any);
    const auth = getAuth(app);
    const db = getFirestore(app);

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

    return { app, auth, db };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    throw error;
  }
};

const { app, auth, db } = initializeFirebase();

export { auth, db };
export default app; 