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

const PDFDocument = require("pdfkit");

const PRIMARY = "#1976d2";
const PRIMARY_DARK = "#115293";
const TEXT = "#212121";
const MUTED = "#666666";
const LINE = "#e0e0e0";

// Standard PDF fonts can't render "₹", so use "INR 1,234.00" style instead of Intl currency style.
const formatMoney = (amount, currency) =>
  `${currency || "INR"} ${(Number(amount) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatShortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const getPages = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const buildInvoicePdf = ({
  invoiceNumber,
  transactionId,
  method,
  date,
  status,
  currency,
  amount,
  baseAmount,
  pagesAmount,
  templateName,
  pages,
  billedName,
  billedEmail,
  seller = {},
}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 40,
      info: { Title: `Invoice ${invoiceNumber}` },
    });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const L = 40; // left edge
    const W = 515; // content width
    const R = L + W;
    let y = 0;

    const ensureSpace = (h) => {
      if (y + h > 770) {
        doc.addPage();
        y = 40;
      }
    };

    const sectionLabel = (text, x, yy, width = W) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor(MUTED)
        .text(text.toUpperCase(), x, yy, { width, characterSpacing: 1 });
    };

    /* ---------- Header band ---------- */
    const grad = doc.linearGradient(0, 0, 595, 80);
    grad.stop(0, PRIMARY).stop(1, PRIMARY_DARK);
    doc.rect(0, 0, 595.28, 80).fill(grad);
    doc
      .font("Helvetica-Bold")
      .fontSize(26)
      .fillColor("#ffffff")
      .text("INVOICE", 0, 28, {
        width: 595.28,
        align: "center",
        characterSpacing: 4,
      });
    y = 110;

    /* ---------- Invoice details ---------- */
    sectionLabel("Invoice details", L, y);
    y += 16;
    const meta = [
      ["Invoice no.", invoiceNumber || "—"],
      ["Date", formatShortDate(date)],
      method ? ["Method", String(method)] : null,
      transactionId ? ["Txn ID", String(transactionId)] : null,
    ].filter(Boolean);
    meta.forEach(([label, value]) => {
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(MUTED)
        .text(label, L, y, { width: 120 });
      doc
        .font("Helvetica-Bold")
        .fillColor(TEXT)
        .text(String(value), L + 130, y, { width: W - 130, align: "right" });
      y += 16;
    });
    y += 14;

    /* ---------- Billed to / From ---------- */
    const colW = (W - 30) / 2;
    const rightX = L + colW + 30;
    sectionLabel("Billed to", L, y, colW);
    sectionLabel("From", rightX, y, colW);
    const blockTop = y + 14;

    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT);
    doc.text(billedName || "—", L, blockTop, { width: colW });
    let leftBottom = doc.y;
    if (billedEmail && billedEmail !== billedName) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED)
        .text(billedEmail, L, leftBottom + 2, { width: colW });
      leftBottom = doc.y;
    }

    doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT);
    doc.text(seller.name || "Company", rightX, blockTop, { width: colW });
    let rightBottom = doc.y;
    if (seller.address) {
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(MUTED)
        .text(seller.address, rightX, rightBottom + 2, { width: colW });
      rightBottom = doc.y;
    }
    y = Math.max(leftBottom, rightBottom) + 24;

    /* ---------- Line items ---------- */
    const cNo = { x: L, w: 50 };
    const cDesc = { x: L + 50, w: 335 };
    const cAmt = { x: L + 385, w: 130 };

    doc.rect(L, y, W, 24).fill("#f5f5f5");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
    doc.text("#", cNo.x + 8, y + 8, {
      width: cNo.w - 8,
      characterSpacing: 0.8,
    });
    doc.text("DESCRIPTION", cDesc.x, y + 8, {
      width: cDesc.w,
      characterSpacing: 0.8,
    });
    doc.text("AMOUNT", cAmt.x, y + 8, {
      width: cAmt.w - 8,
      align: "right",
      characterSpacing: 0.8,
    });
    y += 24;

    const drawItem = (no, title, sub, amountText, boldTitle = true) => {
      const dw = cDesc.w - 10;
      doc.font(boldTitle ? "Helvetica-Bold" : "Helvetica").fontSize(10);
      const h1 = doc.heightOfString(title, { width: dw });
      doc.font("Helvetica").fontSize(8);
      const h2 = doc.heightOfString(sub, { width: dw });
      const h = Math.max(h1 + h2 + 16, 30);
      ensureSpace(h);

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor(TEXT)
        .text(String(no), cNo.x + 8, y + 8, { width: cNo.w - 8 });
      doc
        .font(boldTitle ? "Helvetica-Bold" : "Helvetica")
        .fontSize(10)
        .fillColor(TEXT)
        .text(title, cDesc.x, y + 8, { width: dw });
      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor(MUTED)
        .text(sub, cDesc.x, y + 10 + h1, { width: dw });
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(TEXT)
        .text(amountText, cAmt.x, y + 8, { width: cAmt.w - 8, align: "right" });

      y += h;
      doc.moveTo(L, y).lineTo(R, y).lineWidth(0.5).strokeColor(LINE).stroke();
    };

    drawItem(
      "Site",
      templateName || "Website template",
      "Website template",
      baseAmount != null ? formatMoney(baseAmount, currency) : "—",
    );

    const sorted = [...pages].sort(
      (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0),
    );
    const hasPagePrices = sorted.some((p) => p.price != null && p.price !== "");
    if (hasPagePrices) {
      sorted.forEach((p, i) =>
        drawItem(
          i + 1,
          p.title || `Page #${p.pagesId}`,
          "Additional page",
          formatMoney(p.price, currency),
          false,
        ),
      );
    } else {
      drawItem(
        2,
        `Selected pages (${sorted.length})`,
        sorted.length
          ? sorted.map((p) => p.title || `Page #${p.pagesId}`).join(", ")
          : "No pages recorded",
        pagesAmount != null ? formatMoney(pagesAmount, currency) : "—",
        false,
      );
    }
    y += 20;

    /* ---------- Total band ---------- */
    ensureSpace(60);
    const isPaid = ["paid", "captured", "success", "completed"].includes(
      String(status || "paid").toLowerCase(),
    );
    doc.rect(L, y, W, 34).fill(PRIMARY);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#ffffff")
      .text(
        `${isPaid ? "Total paid" : "Total"}  ${formatMoney(amount, currency)}`,
        L,
        y + 11,
        {
          width: W,
          align: "center",
        },
      );
    y += 34 + 24;

    /* ---------- Footer ---------- */
    ensureSpace(40);
    doc.rect(L, y, W, 0.5).fill(LINE);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        `This is a computer-generated invoice and does not require a signature. For questions, contact ${
          seller.email || seller.name || "support"
        }.`,
        L,
        y + 10,
        { width: W, align: "center" },
      );

    doc.end();
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

const sendPaymentEmail = async ({
  to,
  name,
  templateName,
  invoiceNumber,
  transactionId,
  amount,
  currency,
  method,
  paidAt,
  status = "paid",
  baseAmount = null,
  pagesAmount = null,
  seller = {}, // { name, email, address } shown in the invoice "From" block
  pages: rawPages = [],
}) => {
  if (!to || typeof to !== "string" || !to.includes("@")) {
    throw new HttpError(400, "Invalid recipient email address.");
  }
  if (
    typeof templateName !== "string" ||
    typeof invoiceNumber !== "string" ||
    typeof transactionId !== "string" ||
    !Number.isFinite(Number(amount)) ||
    typeof currency !== "string"
  ) {
    throw new HttpError(400, "Invalid payment confirmation email data.");
  }

  const pages = getPages(rawPages);
  const greeting = name ? `Hi ${escapeHtml(String(name))},` : "Hello,";
  const safeTemplateName = escapeHtml(templateName);
  const safeInvoiceNumber = escapeHtml(invoiceNumber);
  const safeTransactionId = escapeHtml(transactionId);
  const safeCurrency = escapeHtml(currency);
  const safeAmount = Number(amount).toFixed(2);
  const pageLines = pages
    .map((page) => `- ${page.title}: ${page.price} ${currency}`)
    .join("\n");
  const pageRows = pages
    .map(
      (page) =>
        `<li>${escapeHtml(String(page.title ?? ""))}: ${escapeHtml(String(page.price ?? ""))} ${safeCurrency}</li>`,
    )
    .join("");
  const formattedPaidAt = paidAt ? new Date(paidAt).toLocaleString() : "N/A";

  // Build the PDF invoice. If it fails, still send the confirmation email without it.
  const attachments = [];
  try {
    const pdf = await buildInvoicePdf({
      invoiceNumber,
      transactionId,
      method,
      date: paidAt || new Date(),
      status,
      currency,
      amount,
      baseAmount,
      pagesAmount,
      templateName,
      pages,
      billedName: name || to,
      billedEmail: to,
      seller,
    });
    attachments.push({
      filename: `${invoiceNumber.replace(/[^\w.-]+/g, "_")}.pdf`,
      content: pdf,
      contentType: "application/pdf",
    });
  } catch (pdfError) {
    console.error("Invoice PDF generation failed:", pdfError);
  }

  try {
    const info = await transporter.sendMail({
      from:
        process.env.SMTP_FROM ||
        `TenatWebsite <${process.env.SMTP_USER || "noreply@example.com"}>`,
      to,
      subject: `Payment confirmation — ${templateName}`,
      text: [
        name ? `Hi ${name},` : "Hello,",
        "",
        `Your purchase of ${templateName} is confirmed.`,
        `Invoice: ${invoiceNumber}`,
        `Transaction: ${transactionId}`,
        `Amount: ${safeAmount} ${currency}`,
        `Payment method: ${method || "N/A"}`,
        `Paid at: ${formattedPaidAt}`,
        pageLines ? `\nPurchased pages:\n${pageLines}` : "",
        attachments.length ? "\nYour invoice is attached as a PDF." : "",
      ]
        .filter(Boolean)
        .join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Payment confirmed</h2>
          <p>${greeting}</p>
          <p>Your purchase of <strong>${safeTemplateName}</strong> is confirmed.</p>
          <p><strong>Invoice:</strong> ${safeInvoiceNumber}<br>
             <strong>Transaction:</strong> ${safeTransactionId}<br>
             <strong>Amount:</strong> ${safeAmount} ${safeCurrency}<br>
             <strong>Payment method:</strong> ${escapeHtml(String(method || "N/A"))}<br>
             <strong>Paid at:</strong> ${escapeHtml(formattedPaidAt)}</p>
          ${pageRows ? `<p>Purchased pages:</p><ul>${pageRows}</ul>` : ""}
          ${attachments.length ? "<p>Your invoice is attached as a PDF.</p>" : ""}
        </div>
      `,
      attachments,
    });
    console.log(`Payment confirmation email sent to ${to}: ${info.messageId}`);
    return { messageId: info.messageId };
  } catch (error) {
    console.error("Mailer error:", error);
    throw new HttpError(502, "Could not send payment confirmation email.");
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPaymentEmail,
};
