import * as admin from 'firebase-admin';

const serverFirebase = !admin.apps.length
  ? admin.initializeApp({
      credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    })
  : admin.app();

const db = serverFirebase.firestore();

export default db;
