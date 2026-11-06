// Simple mailer utility for site admin credentials
const nodemailer = require("nodemailer");
const { HttpError } = require("./tx");

// Create transporter with environment-based configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "noreply@example.com",
    pass: process.env.SMTP_PASS || "placeholder-password",
  },
  // Additional security settings
  tls: {
    rejectUnauthorized: process.env.NODE_ENV === "production",
  },
});

const escapeHtml = (value) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const sendPasswordResetEmail = async ({ to, name, code, expiresInMinutes }) => {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    throw new HttpError(400, "Invalid recipient email address.");
  }
  if (
    typeof code !== "string" ||
    !/^\d{6}$/.test(code) ||
    typeof expiresInMinutes !== "number" ||
    !Number.isFinite(expiresInMinutes) ||
    expiresInMinutes <= 0
  ) {
    throw new HttpError(400, "Invalid password reset email data.");
  }

  const greeting = name ? `Hi ${escapeHtml(String(name))},` : "Hello,";
  const mailOptions = {
    from:
      process.env.SMTP_FROM ||
      `TenatWebsite <${process.env.SMTP_USER || "noreply@example.com"}>`,
    to,
    subject: "Your password reset code",
    text: `${name ? `Hi ${name},` : "Hello,"}\n\nYour password reset verification code is ${code}. It expires in ${expiresInMinutes} minutes. If you did not request a password reset, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Password reset</h2>
        <p>${greeting}</p>
        <p>Use this verification code to reset your password:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p>This code expires in ${expiresInMinutes} minutes. If you did not request a password reset, you can ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${to}: ${info.messageId}`);
    return { messageId: info.messageId };
  } catch (error) {
    console.error("Mailer error:", error);
    throw new HttpError(502, "Could not send password reset email.");
  }
};

const sendSiteAdminCredentials = async ({ to, siteId, siteName, templateName, ownerName, password }) => {
  // Validate inputs
  if (!to || typeof to !== "string" || !to.includes("@")) {
    throw new HttpError(400, "Invalid recipient email address.");
  }
  if (!siteName || !templateName || !ownerName || !password) {
    throw new HttpError(400, "Missing required data for email.");
  }

  const appUrl = process.env.APP_URL || `http://localhost:5000`;
  const loginUrl = `${appUrl}/site-admin/${siteId}/login`;

  const mailOptions = {
    from: process.env.SMTP_FROM || `TenatWebsite <${process.env.SMTP_USER || "noreply@example.com"}>`,
    to,
    subject: `You now have admin access to ${siteName}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Site Admin Access Granted</h2>
        <p>Hi ${ownerName},</p>
        <p>You have been assigned as a site administrator for <strong>${siteName}</strong> (template: ${templateName}).</p>

        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #2c3e50;">Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${to}</p>
          <p><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 3px;">${password}</code></p>
        </div>

        <p>
          <a href="${loginUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Login to Site Admin Panel
          </a>
        </p>

        <p style="margin-top: 20px;">
          <small>This password is temporary. You will be prompted to change it on first login.</small>
        </p>

        <hr style="border: none; border-top: 1px solid #dee2e6; margin: 20px 0;">
        <p style="font-size: 12px; color: #6c757d;">
          If you did not expect this email, please contact support immediately.<br>
          This email was sent from TenatWebsite platform.
        </p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Site admin credentials email sent to ${to}: ${info.messageId}`);
    return { messageId: info.messageId };
  } catch (error) {
    console.error("Mailer error:", error);
    throw new HttpError(502, "Could not send email with credentials.");
  }
};

module.exports = { sendPasswordResetEmail, sendSiteAdminCredentials };