const db = require("../config/db").promise();

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function withTx(work) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error("Transaction rollback failed:", rollbackError);
    }
    throw error;
  } finally {
    connection.release();
  }
}

function sendError(res, error) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ message: error.message });
  }
  if (error.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ message: "Duplicate entry" });
  }
  if (error.code === "ER_ROW_IS_REFERENCED_2") {
    return res.status(409).json({ message: "Record is in use and cannot be removed" });
  }
  if (error.code === "ER_NO_REFERENCED_ROW_2") {
    return res.status(400).json({ message: "Invalid reference id" });
  }
  console.error(error);
  return res.status(500).json({ message: "Server error" });
}

module.exports = { withTx, HttpError, sendError };