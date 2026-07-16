import * as nodemailer from 'nodemailer';
import * as admin from 'firebase-admin';

// Re-use default transporter but allow overrides from Firebase config/secrets
// Fallback to ethereal email or console transport if not configured
const getTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }
  
  // Dev mode fallback - uses stream transport
  return nodemailer.createTransport({
    streamTransport: true,
    newline: 'windows',
    logger: true
  } as any);
};

export const sendEmail = async (to: string, subject: string, html: string, isRetry = false): Promise<boolean> => {
  const transporter = getTransporter();
  const db = admin.firestore();
  const emailLogRef = db.collection('admin').doc('email_analytics').collection('logs').doc();
  const analyticsRef = db.collection('admin').doc('email_analytics');

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Chalo One" <no-reply@chaloone.com>',
    to,
    subject,
    html
  };

  try {
    const info: any = await transporter.sendMail(mailOptions);
    
    // Log success
    await emailLogRef.set({
      to,
      subject,
      status: 'sent',
      messageId: info.messageId || 'stream',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRetry
    });

    await analyticsRef.set({
      totalSent: admin.firestore.FieldValue.increment(1),
      lastSentAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`[Email Sent] To: ${to} | Subject: ${subject}`);

    return true;
  } catch (error: any) {
    console.error(`Error sending email to ${to}:`, error);

    // Log failure
    await emailLogRef.set({
      to,
      subject,
      status: 'failed',
      error: error.message,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      isRetry
    });

    await analyticsRef.set({
      totalFailed: admin.firestore.FieldValue.increment(1)
    }, { merge: true });

    return false;
  }
};
