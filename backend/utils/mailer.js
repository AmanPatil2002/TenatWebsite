const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true only for port 465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000,
  pool: true,
  maxConnections: 3,
  maxMessages: 100,
});

// Shows SMTP problems at server startup instead of at request time
transporter.verify((err) => {
  if (err) console.error("SMTP config error:", err.code, err.message);
  else console.log("SMTP ready");
});

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const getFrom = () => process.env.MAIL_FROM || process.env.SMTP_FROM || process.env.SMTP_USER;
const getClientUrl = () =>
  (process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");

// Logs the real error, then rethrows so the route can respond
const send = async (label, options) => {
  if (!options.to) {
    const err = new Error(`${label}: recipient email is missing`);
    console.error(err.message);
    throw err;
  }
  try {
    return await transporter.sendMail({ from: getFrom(), ...options });
  } catch (err) {
    console.error(`${label} failed:`, err.code, err.responseCode, err.message);
    err.isQuota = /5\.4\.5|sending limit/i.test(err.response || err.message);
    err.isPermanent = err.responseCode >= 500 && err.responseCode < 600;
    throw err;
  }
};

const sendPaymentEmail = async ({
  to,
  name,
  templateName,
  transactionId,
  invoiceNumber,
  amount,
  currency,
}) =>
  send("sendPaymentEmail", {
    to,
    subject: `Payment received - ${templateName} (${transactionId})`,
    text:
      `Hi ${name},\n\nThank you for your purchase of "${templateName}".\n` +
      `Invoice: ${invoiceNumber}\nTransaction ID: ${transactionId}\n` +
      `Amount paid: ${amount} ${currency}\n\n` +
      `You can now log in and manage your website.`,
    html: `
      <h2>Thank you for your purchase, ${esc(name)}!</h2>
      <p>Your payment for <b>${esc(templateName)}</b> was successful.</p>
      <table cellpadding="6">
        <tr><td>Invoice</td><td><b>${esc(invoiceNumber)}</b></td></tr>
        <tr><td>Transaction ID</td><td><b>${esc(transactionId)}</b></td></tr>
        <tr><td>Amount paid</td><td><b>${esc(amount)} ${esc(currency)}</b></td></tr>
      </table>
      <p>Log in to your account to manage your website.</p>`,
  });

const sendSiteAdminCredentials = async ({
  to,
  siteId,
  siteName,
  templateName,
  ownerName,
  password,
}) => {
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173")
    .split(",")[0]
    .trim()
    .replace(/\/+$/, "");
  const loginUrl = `${clientUrl}/site-admin/${encodeURIComponent(siteId)}/login`;

  return send("sendSiteAdminCredentials", {
    to,
    subject: `Site admin access for ${siteName}`,
    text:
      `Hello,\n\n${ownerName} has granted you access to manage pages for ` +
      `"${siteName}" (${templateName}).\n\n` +
      `Site ID: ${siteId}\nLogin: ${loginUrl}\nEmail: ${to}\n` +
      `Password: ${password}\n\n` +
      "This account can manage pages for this site only. Its theme cannot be changed.",
    html: `
      <h2>Site admin access</h2>
      <p>${esc(ownerName)} has granted you access to manage pages for
         <b>${esc(siteName)}</b> (${esc(templateName)}).</p>
      <p><b>Site ID:</b> ${esc(siteId)}<br />
         <b>Email:</b> ${esc(to)}<br />
         <b>Password:</b> ${esc(password)}</p>
      <p><a href="${esc(loginUrl)}">Sign in to manage pages</a></p>
      <p>This account can manage pages for this site only. Its theme cannot be changed.</p>`,
  });
};

const sendPasswordResetEmail = async ({ to, name, code, expiresInMinutes = 10 }) => {
  const resetUrl = `${getClientUrl()}/reset-password?email=${encodeURIComponent(to)}`;

  return send("sendPasswordResetEmail", {
    to,
    subject: "Reset your password",
    text:
      `Hi ${name},\n\n` +
      `Your password reset code is ${code}.\n` +
      `It expires in ${expiresInMinutes} minutes. Open this page to reset your password:\n` +
      `${resetUrl}\n\n` +
      "If you did not request this, you can ignore this email.",
    html: `
      <h2>Password reset</h2>
      <p>Hi ${esc(name)},</p>
      <p>Open the link below and enter this 6-digit password reset code:</p>
      <p style="font-size:28px;letter-spacing:6px;"><b>${esc(code)}</b></p>
      <p>It expires in ${esc(expiresInMinutes)} minutes.</p>
      <p><a href="${esc(resetUrl)}">Change your password</a></p>
      <p>If you did not request this, you can ignore this email.</p>`,
  });
};

module.exports = {
  sendPaymentEmail,
  sendSiteAdminCredentials,
  sendPasswordResetEmail,
};