"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Templates = void 0;
exports.Templates = {
    layout: (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    }
    .header {
      background-color: #1e1b4b;
      padding: 24px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      letter-spacing: 1px;
    }
    .content {
      padding: 32px;
      line-height: 1.6;
    }
    .content h2 {
      color: #111827;
      font-size: 20px;
      margin-top: 0;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #f59e0b;
      color: #ffffff;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin-top: 16px;
    }
    .footer {
      background-color: #f9fafb;
      padding: 16px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Chalo One</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Chalo One AI Powered App. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`,
    welcomeEmail: (name) => exports.Templates.layout(`
    <h2>Welcome to Chalo One, ${name}!</h2>
    <p>We are thrilled to have you onboard. Chalo One is your everyday super app for rides, bills, food, and more.</p>
    <p>Get started by exploring our services and enjoying exclusive deals!</p>
    <a href="https://chaloone.com" class="button">Explore Chalo One</a>
  `, 'Welcome to Chalo One'),
    verifyEmail: (name, link) => exports.Templates.layout(`
    <h2>Verify your email address</h2>
    <p>Hi ${name},</p>
    <p>Please verify your email address to unlock all features of Chalo One.</p>
    <a href="${link}" class="button">Verify Email</a>
  `, 'Verify your email'),
    passwordReset: (name, link) => exports.Templates.layout(`
    <h2>Reset your password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <a href="${link}" class="button">Reset Password</a>
    <p>If you didn't request this, you can safely ignore this email.</p>
  `, 'Reset your password'),
    walletCredited: (name, amount, newBalance) => exports.Templates.layout(`
    <h2>Wallet Credited</h2>
    <p>Hi ${name},</p>
    <p>Your Chalo One Wallet has been credited with <strong>₹${amount.toFixed(2)}</strong>.</p>
    <p>Your new balance is <strong>₹${newBalance.toFixed(2)}</strong>.</p>
  `, 'Wallet Credited'),
    walletDebited: (name, amount, newBalance, reason) => exports.Templates.layout(`
    <h2>Wallet Payment Successful</h2>
    <p>Hi ${name},</p>
    <p>A payment of <strong>₹${amount.toFixed(2)}</strong> has been deducted from your Chalo One Wallet for ${reason}.</p>
    <p>Your new balance is <strong>₹${newBalance.toFixed(2)}</strong>.</p>
  `, 'Payment Successful'),
    bookingConfirmation: (name, details) => exports.Templates.layout(`
    <h2>Booking Confirmed</h2>
    <p>Hi ${name},</p>
    <p>Your booking has been successfully confirmed.</p>
    <ul>
      <li><strong>Service:</strong> ${details.service}</li>
      <li><strong>Amount:</strong> ₹${details.amount}</li>
      <li><strong>Date:</strong> ${details.date}</li>
    </ul>
    <p>Thank you for choosing Chalo One!</p>
  `, 'Booking Confirmed'),
    adminAlert: (title, details) => exports.Templates.layout(`
    <h2>Admin Alert: ${title}</h2>
    <p>A system event requires your attention:</p>
    <pre style="background: #f1f5f9; padding: 12px; border-radius: 4px; overflow-x: auto;">
${JSON.stringify(details, null, 2)}
    </pre>
  `, 'Admin Alert'),
    accountDeleted: (name) => exports.Templates.layout(`
    <h2>Account Deleted</h2>
    <p>Hi ${name},</p>
    <p>Your Chalo One account has been successfully deleted.</p>
    <p>We're sorry to see you go! If this was a mistake, please contact support immediately.</p>
  `, 'Account Deleted')
};
//# sourceMappingURL=templates.js.map