const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true only for port 465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const sendPaymentEmail = async ({ to, name, templateName, transactionId, amount, currency, pages = [] }) => {
  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_FROM,
    to,
    subject: `Payment received – ${templateName} (${transactionId})`,
    text:
      `Hi ${name},\n\nThank you for your purchase of "${templateName}".\n` +
      `Transaction ID: ${transactionId}\nAmount paid: ${amount} ${currency}\n\n` +
      `You can now log in and manage your website.`,
    html: `
      <h2>Thank you for your purchase, ${esc(name)}!</h2>
      <p>Your payment for <b>${esc(templateName)}</b> was successful.</p>
      <table cellpadding="6">
        <tr><td>Transaction ID</td><td><b>${esc(transactionId)}</b></td></tr>
        <tr><td>Amount paid</td><td><b>${esc(amount)} ${esc(currency)}</b></td></tr>
      </table>
      <p>Log in to your account to manage your website.</p>`,
  });
};

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
  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_FROM,
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

module.exports = { sendPaymentEmail, sendSiteAdminCredentials };