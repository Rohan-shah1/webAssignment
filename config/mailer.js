const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an OTP email via SendGrid
 * @param {string} to - recipient email
 * @param {string} otp - the 6-digit code
 * @param {string} subject - email subject line
 * @param {string} purpose - short description shown in body (e.g., "Google sign-up verification")
 */
const sendOtpEmail = async (to, otp, subject, purpose = 'verification') => {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'RecipeNest',
    },
    subject,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
            .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 16px;
                         border: 1px solid #e5e7eb; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
            .header { background: linear-gradient(90deg, #d97706, #f59e0b); padding: 28px 32px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; letter-spacing: -0.5px; }
            .header p  { color: rgba(255,255,255,0.85); margin: 6px 0 0; font-size: 14px; }
            .body { padding: 36px 32px; }
            .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 20px; }
            .otp-box { background: #fef3c7; border: 2px dashed #d97706; border-radius: 12px;
                       text-align: center; padding: 24px; margin: 24px 0; }
            .otp-code { font-size: 42px; font-weight: 800; color: #92400e; letter-spacing: 10px; }
            .otp-label { font-size: 12px; color: #92400e; margin-top: 6px; }
            .footer { text-align: center; padding: 20px 32px; border-top: 1px solid #e5e7eb; }
            .footer p { color: #9ca3af; font-size: 12px; margin: 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🍽️ RecipeNest</h1>
              <p>Your culinary community</p>
            </div>
            <div class="body">
              <p>Hi there!</p>
              <p>You requested a verification code for <strong>${purpose}</strong>. Use the code below — it expires in <strong>10 minutes</strong>.</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="otp-label">One-Time Password</div>
              </div>
              <p>If you didn't request this, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© 2025 RecipeNest. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await sgMail.send(msg);
};

module.exports = { sendOtpEmail };
