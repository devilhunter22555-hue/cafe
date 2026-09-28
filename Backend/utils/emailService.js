const nodemailer = require('nodemailer');
const User = require('../models/User');
const SuperAdmin = require('../models/SuperAdmin');

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });
}

async function resolveReportRecipient(preferredEmail) {
  if (preferredEmail && String(preferredEmail).trim()) {
    return String(preferredEmail).trim();
  }

  if (process.env.SALES_REPORT_EMAIL && String(process.env.SALES_REPORT_EMAIL).trim()) {
    return String(process.env.SALES_REPORT_EMAIL).trim();
  }

  try {
    const owner = await User.findOne({ role: 'owner', isActive: true })
      .sort({ createdAt: 1 })
      .select('email')
      .lean();
    if (owner?.email) return owner.email;

    const superAdmin = await SuperAdmin.findOne({ isActive: true })
      .sort({ createdAt: 1 })
      .select('email')
      .lean();
    if (superAdmin?.email) return superAdmin.email;
  } catch (err) {
    console.error('[EmailService] Failed to lookup fallback recipient from DB:', err.message);
  }

  if (process.env.SMTP_USER && String(process.env.SMTP_USER).trim()) {
    return String(process.env.SMTP_USER).trim();
  }

  return null;
}

async function sendSalesReportEmail({ to, subject, text, html }) {
  try {
    const recipient = await resolveReportRecipient(to);
    if (!recipient) {
      const msg = 'No recipient email configured (set SALES_REPORT_EMAIL in .env)';
      console.warn(`[EmailService] ${msg}`);
      return { sent: false, error: msg };
    }

    const transporter = createTransporter();
    if (!transporter) {
      const msg = 'SMTP credentials are not configured in .env (SMTP_HOST, SMTP_USER, SMTP_PASSWORD)';
      console.warn(`[EmailService] ${msg}`);
      return { sent: false, recipient, error: msg };
    }

    const fromAddress = `"Café Management System" <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject,
      text,
      html
    });

    console.log(`[EmailService] Email "${subject}" sent to ${recipient} (messageId: ${info.messageId})`);
    return { sent: true, recipient, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send email "${subject}":`, error.message);
    return { sent: false, error: error.message };
  }
}

async function sendEmailVerificationOtp({
  email,
  otp,
  cafeName = '',
  adminName = '',
  expiresInMinutes = 5
}) {
  const recipient = String(email || '').trim().toLowerCase();
  if (!recipient || !otp) {
    return { sent: false, error: 'Recipient email and OTP are required' };
  }

  const subject = cafeName
    ? `${cafeName} — Email Verification Code`
    : 'Café Management System — Email Verification Code';

  const text = [
    `Hello ${adminName || 'Café Admin'},`,
    '',
    `Your 6-digit email verification code for onboarding ${cafeName ? `"${cafeName}"` : 'your café account'} is:`,
    '',
    `Verification Code: ${otp}`,
    '',
    `This code expires in ${expiresInMinutes} minutes. Do not share this code with anyone.`,
    '',
    'Thank you,',
    'Café Management System'
  ].join('\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #F7F5F2; padding: 24px; color: #241B15;">
      <div style="background: #2B2118; color: #FFFFFF; padding: 22px 24px; border-radius: 16px 16px 0 0;">
        <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #C98A5B; font-weight: 700;">
          Super Admin · Café Onboarding
        </p>
        <h1 style="margin: 6px 0 0; font-size: 20px; font-weight: 800;">
          Verify Email Address
        </h1>
      </div>
      <div style="background: #FFFFFF; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #E8E1DA; border-top: none;">
        <p style="font-size: 14px; line-height: 1.6; margin-top: 0;">
          Hello <strong>${adminName || 'Café Admin'}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6;">
          Use the 6-digit verification code below to verify <strong>${recipient}</strong>${cafeName ? ` for <strong>${cafeName}</strong>` : ''}:
        </p>
        <div style="background: #F7F5F2; border: 2px dashed #6F4E37; border-radius: 14px; padding: 18px; margin: 20px 0; text-align: center;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: 8px; color: #2B2118; font-family: 'Courier New', monospace;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 12px; color: #81766D; line-height: 1.5; margin-bottom: 0;">
          This verification code is valid for <strong>${expiresInMinutes} minutes</strong> and allows a maximum of 5 verification attempts.
        </p>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    if (!transporter) {
      const isProduction = process.env.NODE_ENV === 'production';
      const isStrict = process.env.EMAIL_SERVICE_STRICT === 'true';

      if (isProduction || isStrict) {
        return {
          sent: false,
          recipient,
          error: 'Email service (SMTP) is not configured on the server.'
        };
      }

      // In local development when SMTP is not configured, log to server console only (never in production, never in API response)
      console.info(
        `[EmailService][DEV] Verification OTP generated for ${recipient}: ${otp} (expires in ${expiresInMinutes}m)`
      );
      return { sent: true, recipient, simulated: true };
    }

    const fromAddress = `"Café Management System" <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
      from: fromAddress,
      to: recipient,
      subject,
      text,
      html
    });

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[EmailService] Verification OTP email sent to ${recipient} (messageId: ${info.messageId})`);
    }
    return { sent: true, recipient, messageId: info.messageId };
  } catch (error) {
    console.error(`[EmailService] Failed to send verification OTP email to ${recipient}:`, error.message);
    return {
      sent: false,
      recipient,
      error: 'Unable to send verification email right now. Please check email service settings and try again.'
    };
  }
}

async function sendCafeWelcomeEmail({ cafeName, adminName, adminEmail, loginUrl }) {
  try {
    if (!adminEmail) return { sent: false, error: 'Missing adminEmail' };
    const transporter = createTransporter();
    if (!transporter) {
      return { sent: false, error: 'SMTP not configured' };
    }

    const portalUrl = loginUrl || process.env.CLIENT_URL || 'http://localhost:5173/login';
    const subject = `Welcome to Café Management System — ${cafeName}`;
    const text = [
      `Hello ${adminName || 'Café Admin'},`,
      '',
      `Your café account "${cafeName}" has been created by the Super Administrator.`,
      '',
      `Café Name: ${cafeName}`,
      `Admin Login Email: ${adminEmail}`,
      `POS & Admin Portal URL: ${portalUrl}`,
      '',
      'Setup Instructions:',
      'Use the temporary password provided securely by your system administrator to sign in, then update your credentials and configure your menu, tables, and staff.',
      '',
      'Thank you,',
      'Café Management System'
    ].join('\n');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #F7F5F2; padding: 24px; color: #241B15;">
        <div style="background: #2B2118; color: #FFFFFF; padding: 24px; border-radius: 16px 16px 0 0;">
          <p style="margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #C98A5B; font-weight: 700;">
            Café Management System
          </p>
          <h1 style="margin: 8px 0 4px; font-size: 22px; font-weight: 800;">
            Welcome to ${cafeName}!
          </h1>
        </div>
        <div style="background: #FFFFFF; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #E8E1DA; border-top: none;">
          <p style="font-size: 14px; line-height: 1.6;">
            Hello <strong>${adminName || 'Café Admin'}</strong>, your café workspace has been provisioned and activated.
          </p>
          <div style="background: #F7F5F2; border: 1px solid #E8E1DA; border-radius: 12px; padding: 16px; margin: 16px 0; font-size: 13px;">
            <p style="margin: 4px 0;"><strong>Café Name:</strong> ${cafeName}</p>
            <p style="margin: 4px 0;"><strong>Admin Email:</strong> ${adminEmail}</p>
            <p style="margin: 4px 0;"><strong>Login URL:</strong> <a href="${portalUrl}" style="color: #6F4E37; font-weight: 700;">${portalUrl}</a></p>
          </div>
          <p style="font-size: 12px; color: #81766D; line-height: 1.5;">
            Sign in using the temporary password shared by your platform administrator. For security, passwords are never transmitted in plain text over email.
          </p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Café Management System" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject,
      text,
      html
    });

    return { sent: true, recipient: adminEmail, messageId: info.messageId };
  } catch (error) {
    console.warn('[EmailService] Welcome email skipped or failed:', error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  createTransporter,
  resolveReportRecipient,
  sendSalesReportEmail,
  sendEmailVerificationOtp,
  sendCafeWelcomeEmail
};
