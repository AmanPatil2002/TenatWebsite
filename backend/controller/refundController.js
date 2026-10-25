const db = require("../config/db");

const validId = (id) =>
  /^[1-9]\d*$/.test(String(id)) && BigInt(id) <= 18446744073709551615n;
const isAdmin = (req) => req.user?.role === "admin";
const REFUND_STATUSES = ["processed", "rejected"];

const requestRefund = async (req, res) => {
  const { siteId } = req.params;
  const { paymentId, amount, reason = null } = req.body;
  if (!validId(paymentId)) return res.status(400).json({ message: "Invalid payment ID" });
  const amountValue =
    typeof amount === "number" || typeof amount === "string"
      ? String(amount).trim()
      : "";
  const refundAmount = Number(amountValue);
  if (
    !/^\d+(?:\.\d{1,2})?$/.test(amountValue) ||
    !Number.isFinite(refundAmount) ||
    refundAmount <= 0 ||
    refundAmount > 99999999.99
  ) {
    return res.status(400).json({ message: "Refund amount must be positive and have at most two decimal places" });
  }
  if (reason !== null && (typeof reason !== "string" || reason.trim().length > 255)) {
    return res.status(400).json({ message: "Reason must be 255 characters or fewer" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [payments] = await connection.execute(
      `SELECT p.id, p.amount, p.status
         FROM payments p
         JOIN sites s ON s.paymentId = p.id
        WHERE p.id = ? AND s.id = ? AND s.userId = ?
        FOR UPDATE`,
      [paymentId, siteId, req.user.userId]
    );
    if (!payments.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Purchase not found for this site" });
    }
    if (payments[0].status !== "captured") {
      await connection.rollback();
      return res.status(409).json({ message: "Only captured payments can be refunded" });
    }
    const [existing] = await connection.execute(
      `SELECT COALESCE(SUM(amount), 0) AS amount
         FROM refunds WHERE paymentId = ? AND status IN ('requested', 'processed')`,
      [paymentId]
    );
    const remaining = Number(payments[0].amount) - Number(existing[0].amount);
    if (refundAmount > remaining) {
      await connection.rollback();
      return res.status(400).json({ message: `Refund amount cannot exceed ${remaining.toFixed(2)}` });
    }
    const [result] = await connection.execute(
      `INSERT INTO refunds (siteId, paymentId, amount, reason)
       VALUES (?, ?, ?, ?)`,
      [siteId, paymentId, refundAmount.toFixed(2), reason?.trim() || null]
    );
    await connection.commit();
    res.status(201).json({ message: "Refund requested", refundId: result.insertId });
  } catch (error) {
    await connection.rollback();
    console.error("requestRefund error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

const listSiteRefunds = (req, res) => {
  db.query(
    `SELECT r.id, r.siteId, r.paymentId, r.amount, r.reason, r.status,
            r.processedBy, r.createdAt
       FROM refunds r WHERE r.siteId = ? ORDER BY r.createdAt DESC`,
    [req.params.siteId],
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const listAllRefunds = (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  db.query(
    `SELECT r.id, r.siteId, s.name AS siteName, r.paymentId, p.transactionId,
            r.amount, r.reason, r.status, r.processedBy, r.createdAt,
            u.name AS requesterName, u.email AS requesterEmail
       FROM refunds r
       JOIN sites s ON s.id = r.siteId
       JOIN payments p ON p.id = r.paymentId
       JOIN users u ON u.userId = s.userId
      ORDER BY r.createdAt DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
};

const updateRefundStatus = async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { refundId } = req.params;
  const { status } = req.body;
  if (!validId(refundId)) return res.status(400).json({ message: "Invalid refund ID" });
  if (!REFUND_STATUSES.includes(status)) {
    return res.status(400).json({ message: "Status must be processed or rejected" });
  }

  const connection = await db.promise().getConnection();
  try {
    await connection.beginTransaction();
    const [refunds] = await connection.execute(
      `SELECT id, paymentId, amount, status
         FROM refunds WHERE id = ? FOR UPDATE`,
      [refundId]
    );
    if (!refunds.length) {
      await connection.rollback();
      return res.status(404).json({ message: "Refund not found" });
    }
    if (refunds[0].status !== "requested") {
      await connection.rollback();
      return res.status(409).json({ message: "Refund has already been processed" });
    }
    await connection.execute(
      "UPDATE refunds SET status = ?, processedBy = ? WHERE id = ?",
      [status, req.user.userId, refundId]
    );

    if (status === "processed") {
      const [totals] = await connection.execute(
        `SELECT p.amount AS paymentAmount,
                COALESCE(SUM(CASE WHEN r.status = 'processed' THEN r.amount ELSE 0 END), 0) AS refundedAmount
           FROM payments p LEFT JOIN refunds r ON r.paymentId = p.id
          WHERE p.id = ? GROUP BY p.id`,
        [refunds[0].paymentId]
      );
      if (totals.length && Number(totals[0].refundedAmount) >= Number(totals[0].paymentAmount)) {
        await connection.execute(
          "UPDATE payments SET status = 'refunded' WHERE id = ? AND status = 'captured'",
          [refunds[0].paymentId]
        );
      }
    }
    await connection.commit();
    res.json({ message: "Refund status updated", refundId, status });
  } catch (error) {
    await connection.rollback();
    console.error("updateRefundStatus error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    connection.release();
  }
};

module.exports = { requestRefund, listSiteRefunds, listAllRefunds, updateRefundStatus };
