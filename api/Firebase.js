// Initialize Firebase
import firebase from 'firebase/app';
import 'firebase/firestore';

const config = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DB_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Protect against multiple instances of firebase
if (!firebase.apps.length) {
  firebase.initializeApp(config);
}

/**
 * Firebase API
 *
 * @class Firebase
 * @namespace Firebase
 */
class Firebase {
  constructor() {
    this.firebase = firebase;
    this.firestore = firebase.firestore;
    this.db = this.firestore();
    this.gameCollectionPath = 'games';
  }
}

export default Firebase;
