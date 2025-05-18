const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter = null;

// Initialize email transporter
const initializeTransporter = async () => {
  if (transporter) return;

  try {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Verify connection
    await transporter.verify();
    console.log('Email service initialized successfully');
  } catch (error) {
    console.error('Email service initialization error:', error.message);
    throw error;
  }
};

// Send email notification
const sendEmail = async (user, notification) => {
  try {
    if (!transporter) {
      await initializeTransporter();
    }

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'Notification Service'} <${process.env.SMTP_USER}>`,
      to: user.email,
      subject: notification.title,
      text: notification.content,
      html: notification.metadata.html || `<p>${notification.content}</p>`
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${user.email}: ${info.messageId}`);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Email service error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Initialize email service when the module is loaded
initializeTransporter().catch(console.error);

module.exports = { sendEmail };