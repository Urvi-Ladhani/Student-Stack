const nodemailer = require('nodemailer');

/**
 * Sends an email using Nodemailer.
 * If SMTP configuration variables are not set in the environment,
 * it safely logs the email contents (including the reset link) to the backend console.
 * 
 * @param {Object} options
 * @param {string} options.to Destination email address
 * @param {string} options.subject Email subject
 * @param {string} options.html HTML email content
 */
const sendEmail = async ({ to, subject, html }) => {
  const smtpHost = (process.env.SMTP_HOST || '').trim();
  const smtpUser = (process.env.SMTP_USER || '').trim();
  const smtpPass = (process.env.SMTP_PASS || ''); // Keep password as is to preserve any leading/trailing spaces in secret key
 
  const isSmtpConfigured = smtpHost && smtpUser && smtpPass;

  if (!isSmtpConfigured) {
    try {
      // Automatically generate a test SMTP account on ethereal.email
      const testAccount = await nodemailer.createTestAccount();
      
      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await transporter.sendMail({
        from: '"StudentStack Test" <noreply@studentstack.com>',
        to,
        subject,
        html,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log('\n==================================================================');
      console.log('🤖  STUDENTSTACK DEVELOPER EMAIL (ETHEREAL TEST ACCOUNT)');
      console.log(`📬  TO: ${to}`);
      console.log(`🔑  SUBJECT: ${subject}`);
      console.log(`🔗  PREVIEW EMAIL ONLINE: \x1b[36m${previewUrl}\x1b[0m`);
      console.log('==================================================================\n');

      return { success: true, loggedToConsole: true, previewUrl };
    } catch (err) {
      console.error('Failed to send test email via Ethereal:', err);
      
      // Secondary fallback to standard console logging
      console.log('\n==================================================================');
      console.log('🤖  STUDENTSTACK DEVELOPER EMAIL LOGGING FALLBACK');
      console.log(`📬  TO: ${to}`);
      console.log(`🔑  SUBJECT: ${subject}`);
      console.log('==================================================================');
      
      // Extract reset link for quick copying in developers console
      const linkMatch = html.match(/href="([^"]+)"/);
      if (linkMatch && linkMatch[1]) {
        console.log(`🔗  RESET LINK: \x1b[36m${linkMatch[1]}\x1b[0m`);
      } else {
        console.log('No links found in HTML content.');
      }
      
      console.log('------------------------------------------------------------------');
      console.log('📄  HTML PREVIEW (First 20 lines):');
      console.log(html.split('\n').slice(0, 20).join('\n'));
      console.log('==================================================================\n');
      
      return { success: true, loggedToConsole: true };
    }
  }

  // Configure Nodemailer transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_PORT || '').trim() === '465',
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      // Prevent failure due to self-signed or unauthorized certificates (common in local/dev environments)
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: (process.env.EMAIL_FROM || '').trim() || `"StudentStack" <${smtpUser}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
  return { success: true };
};

/**
 * Generates a clean HTML template for password resets with StudentStack premium theme.
 * 
 * @param {string} userName Recipient's name
 * @param {string} resetUrl Password reset URL
 * @returns {string} Fully styled HTML string
 */
const getResetPasswordTemplate = (userName, resetUrl) => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>Reset Password - StudentStack</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style type="text/css">
    body, table, td, a {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    body {
      background-color: #040712;
      margin: 0;
      padding: 0;
      width: 100% !important;
    }
    .wrapper {
      width: 100%;
      background-color: #040712;
      padding: 40px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    .header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .logo-container {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 12px;
      border-radius: 16px;
      margin-bottom: 12px;
    }
    .logo-text {
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .content {
      padding: 40px 30px;
      color: #cbd5e1;
      font-size: 16px;
      line-height: 1.6;
    }
    .greeting {
      color: #ffffff;
      font-size: 20px;
      font-weight: 600;
      margin-top: 0;
      margin-bottom: 16px;
    }
    .button-container {
      margin: 32px 0;
      text-align: center;
    }
    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #1d4ed8);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 30px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      transition: transform 0.2s ease;
    }
    .notice {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 16px;
      margin-top: 24px;
      font-size: 14px;
      color: #94a3b8;
    }
    .footer {
      padding: 24px 30px;
      background-color: #0b0f19;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .footer a {
      color: #3b82f6;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <div class="logo-container">
          <!-- Command line symbol SVG mockup for StudentStack -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </div>
        <h1 class="logo-text">StudentStack</h1>
      </div>
      <div class="content">
        <h2 class="greeting">Hello, ${userName}</h2>
        <p>We received a request to reset your StudentStack account password. Click the button below to secure a new password for your account:</p>
        
        <div class="button-container">
          <a href="${resetUrl}" target="_blank" class="btn-primary">Reset Password</a>
        </div>
        
        <p>Or copy and paste this link into your browser address bar:</p>
        <p style="word-break: break-all; font-size: 13px; color: #3b82f6;">${resetUrl}</p>
        
        <div class="notice">
          <strong>Expiration Notice:</strong> This reset link will automatically expire in <strong>15 minutes</strong> for security reasons.
        </div>
        
        <p style="margin-top: 24px; font-size: 14px; color: #94a3b8;">
          <strong>Security Warning:</strong> If you did not make this request, you can safely ignore this email. Your current password remains secure, but you may want to ensure your account security is configured properly.
        </p>
      </div>
      <div class="footer">
        <p>This is an automated system message. Please do not reply to this email.</p>
        <p>© 2026 StudentStack. Elevate Your Engineering Studies.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

module.exports = {
  sendEmail,
  getResetPasswordTemplate,
};
