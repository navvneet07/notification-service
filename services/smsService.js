const twilio = require('twilio');

// Create Twilio client
let client = null;

// Initialize Twilio client
const initializeClient = () => {
  if (client) return;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  client = twilio(accountSid, authToken);
  console.log('SMS service initialized successfully');
};

// Format phone number to E.164 format
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add country code if not present (assuming US/Canada numbers)
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  }
  
  // If number already has country code (starts with +)
  if (phoneNumber.startsWith('+')) {
    return cleaned;
  }
  
  throw new Error('Invalid phone number format');
};

// Send SMS notification
const sendSMS = async (user, notification) => {
  try {
    if (!user.phoneNumber) {
      throw new Error('User has no phone number');
    }

    if (!client) {
      initializeClient();
    }

    const formattedPhone = formatPhoneNumber(user.phoneNumber);
    const messageContent = `${notification.title}\n\n${notification.content}`;

    const message = await client.messages.create({
      body: messageContent,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedPhone
    });

    console.log(`SMS sent to ${user.phoneNumber}: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error(`SMS service error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Initialize SMS service when the module is loaded
try {
  initializeClient();
} catch (error) {
  console.error('SMS service initialization error:', error.message);
}

module.exports = { sendSMS };