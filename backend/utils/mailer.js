const nodemailer = require("nodemailer");
const PDFDocument = require("pdfkit");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true only for port 465
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const esc = (v) =>
  String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const pdfText = (value) => String(value ?? "—").replace(/[^\x20-\x7E]/g, "?");

const formatInvoiceAmount = (amount, currency) =>
  `${Number(amount || 0).toFixed(2)} ${currency || ""}`.trim();

const createInvoicePdf = (invoice) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.info.Title = `Invoice ${pdfText(invoice.invoiceNumber)}`;
    doc.info.Author = "Your Company Name";
    doc.fillColor("#17365d").font("Helvetica-Bold").fontSize(22).text("INVOICE");
    doc.fillColor("#333333").font("Helvetica").fontSize(10)
      .text(pdfText(invoice.invoiceNumber));
    doc.moveDown(1.5);

    doc.font("Helvetica-Bold").fontSize(10).text("FROM");
    doc.font("Helvetica").fontSize(10)
      .text("Your Company Name")
      .text("Street address, City, State")
      .text("support@yourcompany.com");
    doc.moveDown();

    const paidAt = invoice.paidAt ? new Date(invoice.paidAt) : new Date();
    const invoiceDate = Number.isNaN(paidAt.getTime())
      ? "—"
      : paidAt.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
    doc.font("Helvetica-Bold").text("BILLED TO");
    doc.font("Helvetica").text(pdfText(invoice.name)).text(pdfText(invoice.to));
    doc.moveDown();
    doc.font("Helvetica-Bold").text("INVOICE DETAILS");
    doc.font("Helvetica")
      .text(`Date: ${invoiceDate}`)
      .text("Status: Paid")
      .text(`Method: ${pdfText(invoice.method || "manual")}`)
      .text(`Transaction ID: ${pdfText(invoice.transactionId)}`);
    doc.moveDown();

    doc.font("Helvetica-Bold").text("PURCHASE");
    doc.moveDown(0.5);
    doc.font("Helvetica").text(`Website template: ${pdfText(invoice.templateName)}`);
    doc.text(`Template price: ${formatInvoiceAmount(invoice.baseAmount, invoice.currency)}`);
    if (invoice.pages?.length) {
      doc.moveDown(0.5);
      doc.text("Selected pages:");
      invoice.pages.forEach((page) => {
        doc.text(
          `  ${pdfText(page.title)}: ${formatInvoiceAmount(page.price, invoice.currency)}`,
          { indent: 8 },
        );
      });
    }

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
    doc.moveDown(0.75);
    doc.font("Helvetica-Bold").fontSize(13)
      .text(`TOTAL PAID: ${formatInvoiceAmount(invoice.amount, invoice.currency)}`);
    doc.moveDown(2);
    doc.font("Helvetica").fontSize(9).fillColor("#666666")
      .text("Thank you for your purchase. This is a computer-generated invoice and does not require a signature.");
    doc.end();
  });

const sendPaymentEmail = async ({
  to,
  name,
  templateName,
  transactionId,
  invoiceNumber,
  amount,
  baseAmount,
  currency,
  method,
  paidAt,
  pages = [],
}) => {
  const invoice = {
    to,
    name,
    templateName,
    transactionId,
    invoiceNumber,
    amount,
    baseAmount,
    currency,
    method,
    paidAt,
    pages,
  };
  const invoicePdf = await createInvoicePdf(invoice);
  const safeInvoiceNumber = String(invoiceNumber || transactionId).replace(/[^a-zA-Z0-9_-]/g, "_");

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_FROM,
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
      <p>Your invoice is attached. Log in to your account to manage your website.</p>`,
    attachments: [
      {
        filename: `invoice-${safeInvoiceNumber}.pdf`,
        content: invoicePdf,
        contentType: "application/pdf",
      },
    ],
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