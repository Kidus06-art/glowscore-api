// firebase-admin.js
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Download this from Firebase Console

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
module.exports = db;
