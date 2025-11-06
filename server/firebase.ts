import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'manifiesto-c0f62';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // Try to initialize with service account if available
  if (clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'manifiesto-c0f62.firebasestorage.app',
    });
    console.log('✅ Firebase Admin initialized with service account');
  } else {
    // For Replit/development: Initialize with project ID only
    // This will use the Firebase REST API without admin privileges
    console.log('⚠️ Initializing Firebase Admin without credentials (limited functionality)');
    console.log('📝 To enable full admin features, add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY');
    
    admin.initializeApp({
      projectId,
      storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'manifiesto-c0f62.firebasestorage.app',
    });
  }
}

export const db = admin.firestore();
export const storage = admin.storage();
export const auth = admin.auth();

export default admin;
