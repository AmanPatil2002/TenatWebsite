const crypto = require("crypto");
const { HttpError } = require("./tx");

const credentials = () => {
  const { RAZORPAY_KEY_ID: keyId, RAZORPAY_KEY_SECRET: keySecret } = process.env;
  if (!keyId || !keySecret) {
    throw new HttpError(503, "Razorpay is not configured on the server");
  }
  return { keyId, keySecret };
};

const razorpayRequest = async (method, endpoint, body) => {
  const { keyId, keySecret } = credentials();
  let response;
  try {
    response = await fetch(`https://api.razorpay.com/v1${endpoint}`, {
      method,
      signal: AbortSignal.timeout(15000),
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    console.error("Razorpay request failed:", error.message);
    throw new HttpError(502, "Unable to contact the payment provider");
  }

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.error("Razorpay API returned an error:", response.status, data?.error?.code);
    throw new HttpError(502, "Payment provider rejected the request");
  }
  if (!data || typeof data !== "object") {
    throw new HttpError(502, "Payment provider returned an invalid response");
  }
  return data;
};

const createOrder = (data) => razorpayRequest("POST", "/orders", data);
const fetchPayment = (paymentId) =>
  razorpayRequest("GET", `/payments/${encodeURIComponent(paymentId)}`);
const listOrderPayments = (orderId) =>
  razorpayRequest("GET", `/orders/${encodeURIComponent(orderId)}/payments`);

const hmac = (secret, value) =>
  crypto.createHmac("sha256", secret).update(value).digest("hex");

const matchesSignature = (expected, supplied) => {
  if (typeof supplied !== "string" || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expectedBuffer = Buffer.from(expected, "hex");
  const suppliedBuffer = Buffer.from(supplied, "hex");
  return expectedBuffer.length === suppliedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
};

const verifyCheckoutSignature = (orderId, paymentId, signature) => {
  const { keySecret } = credentials();
  return matchesSignature(hmac(keySecret, `${orderId}|${paymentId}`), signature);
};

const verifyWebhookSignature = (rawBody, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new HttpError(503, "Razorpay webhook is not configured on the server");
  return matchesSignature(hmac(secret, rawBody), signature);
};

module.exports = {
  credentials,
  createOrder,
  fetchPayment,
  listOrderPayments,
  verifyCheckoutSignature,
  verifyWebhookSignature,
};