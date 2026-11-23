const crypto = require("crypto");

const SANDBOX_URL = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

function getConfig() {
  const tmnCode = process.env.VNPAY_TMN_CODE;
  const hashSecret = process.env.VNPAY_HASH_SECRET;
  const returnUrl = process.env.VNPAY_RETURN_URL;

  if (!tmnCode || !hashSecret || !returnUrl) {
    throw new Error("VNPAY_NOT_CONFIGURED");
  }

  return { tmnCode, hashSecret, returnUrl };
}

function sortParams(params) {
  return Object.keys(params)
    .filter((key) => params[key] !== undefined && params[key] !== null && params[key] !== "")
    .sort()
    .reduce((result, key) => {
      result[key] = String(params[key]);
      return result;
    }, {});
}

function sign(params, hashSecret) {
  const payload = new URLSearchParams(sortParams(params)).toString();
  return crypto.createHmac("sha512", hashSecret).update(payload, "utf8").digest("hex");
}

function formatDate(date = new Date()) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ].join("");
}

function getClientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.ip || req.socket?.remoteAddress || "127.0.0.1";
}

function createPaymentUrl({ txnRef, amount, orderInfo, req }) {
  const { tmnCode, hashSecret, returnUrl } = getConfig();
  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(Math.round(Number(amount) * 100)),
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: getClientIp(req),
    vnp_CreateDate: formatDate(),
  };

  return `${SANDBOX_URL}?${new URLSearchParams({
    ...sortParams(params),
    vnp_SecureHash: sign(params, hashSecret),
  }).toString()}`;
}

function verifyCallback(query) {
  const { hashSecret } = getConfig();
  const receivedHash = String(query.vnp_SecureHash || "").toLowerCase();
  if (!receivedHash) return false;

  const params = { ...query };
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  const expectedHash = sign(params, hashSecret);
  const received = Buffer.from(receivedHash, "utf8");
  const expected = Buffer.from(expectedHash, "utf8");
  return received.length === expected.length && crypto.timingSafeEqual(received, expected);
}

module.exports = { createPaymentUrl, verifyCallback };
