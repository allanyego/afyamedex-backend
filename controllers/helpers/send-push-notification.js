const admin = require("firebase-admin");

const serviceAccount = require("./firebase-config");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://sf-server-35dd9.firebaseio.com",
});

async function sendPushNotification(token, payload, options) {
  return await admin.messaging().sendToDevice(token, payload, options);
}

module.exports = sendPushNotification;
