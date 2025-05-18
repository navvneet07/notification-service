const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let initialized = false;

// Initialize Firebase Admin
const initializeFirebase = () => {
  if (initialized) return;

  try {
    // Initialize with service account
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      }),
      // Optional: database URL if you're using Realtime Database
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });

    initialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error.message);
    throw error;
  }
};

// Send in-app notification
const sendInAppNotification = async (user, notification) => {
  try {
    if (!user.deviceToken) {
      throw new Error('User has no device token');
    }

    if (!initialized) {
      initializeFirebase();
    }

    const message = {
      token: user.deviceToken,
      notification: {
        title: notification.title,
        body: notification.content
      },
      data: {
        notificationId: notification._id.toString(),
        type: notification.type
      },
      android: {
        priority: 'high',
        notification: {
          clickAction: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };

    let messaging;
    try {
      messaging = admin.messaging();
    } catch (error) {
      throw new Error('FCM error: Failed to initialize messaging');
    }

    const response = await messaging.send(message);
    console.log(`Push notification sent to ${user.deviceToken}: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`In-app notification service error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Initialize Firebase when the module is loaded
try {
  initializeFirebase();
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

module.exports = { sendInAppNotification };