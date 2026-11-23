const crypto = require("crypto");
const pool = require("../../config/db");
const wallet = require("../services/wallet");
const membership = require("../services/membership");
const { createPaymentUrl, verifyCallback } = require("../services/vnpay");

function newTxnRef() {
  return `RM${Date.now()}${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function expectedAmount(totalAmount) {
  return String(Math.round(Number(totalAmount) * 100));
}

function ipnResponse(res, RspCode, Message) {
  return res.status(200).json({ RspCode, Message });
}

async function applyCashbackIfAny({ userId, orderId, totalAmount }) {
  const ruleResult = await pool.query(
    `SELECT * FROM cashback_rules WHERE active=true ORDER BY id DESC LIMIT 1`
  );
  const rule = ruleResult.rows[0];
  if (!rule) return;

  let amount = (Number(rule.percent || 0) / 100) * Number(totalAmount);
  if (rule.max_amount != null) amount = Math.min(amount, Number(rule.max_amount));
  if (amount > 0) {
    await wallet.addBonus({
      userId,
      amount,
      reason: "cashback_order_paid",
      meta: { orderId, ruleId: rule.id },
    });
  }
}

async function createWalletSession(req, res) {
  const userId = req.user.userId;
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ message: "Missing orderId" });

  const orderResult = await pool.query(
    `SELECT orderid, userid, paymentstatus, orderstatus, totalamount
       FROM productorders WHERE orderid=$1`,
    [orderId]
  );
  if (!orderResult.rows.length) return res.status(404).json({ message: "Order not found" });

  const order = orderResult.rows[0];
  if (order.userid !== userId) return res.status(403).json({ message: "Forbidden" });
  if (order.paymentstatus !== "unpaid" || order.orderstatus !== "pending") {
    return res.status(400).json({ message: "Order is not payable" });
  }

  const inserted = await pool.query(
    `INSERT INTO paymentsessions(orderid, provider, status, qr_url, expire_at, userid)
     VALUES($1,'wallet','pending',NULL,(CURRENT_TIMESTAMP + INTERVAL '10 minutes'),$2)
     RETURNING *`,
    [orderId, userId]
  );
  const session = inserted.rows[0];

  try {
    const { freezeId } = await wallet.freezeAmount({
      userId,
      orderId,
      amount: order.totalamount,
      reason: "checkout_wallet",
      expireAt: session.expire_at,
    });
    await pool.query(`UPDATE paymentsessions SET freeze_id=$1 WHERE id=$2`, [freezeId, session.id]);
    return res.status(201).json({
      id: session.id,
      orderid: session.orderid,
      provider: "wallet",
      status: session.status,
      expire_at: session.expire_at,
    });
  } catch (error) {
    await pool.query(`DELETE FROM paymentsessions WHERE id=$1`, [session.id]);
    return res.status(400).json({
      message: error.message === "INSUFFICIENT_FUNDS" ? "Số dư ví không đủ" : error.message || "Không thể giữ số dư ví",
    });
  }
}

async function createSession(req, res) {
  try {
    const { provider = "wallet" } = req.body || {};
    if (provider !== "wallet") {
      return res.status(400).json({ message: "Use the VNPay payment endpoint for online payment" });
    }
    return createWalletSession(req, res);
  } catch (error) {
    console.error("createSession error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}

async function getSession(req, res) {
  try {
    const userId = req.user.userId;
    const sessionResult = await pool.query(
      `SELECT ps.*, po.userid AS owner_userid
         FROM paymentsessions ps
         JOIN productorders po ON po.orderid=ps.orderid
        WHERE ps.id=$1`,
      [Number(req.params.id)]
    );
    if (!sessionResult.rows.length) return res.status(404).json({ message: "Not found" });
    const session = sessionResult.rows[0];
    if (session.owner_userid !== userId) return res.status(403).json({ message: "Forbidden" });
    return res.json({
      id: session.id,
      orderid: session.orderid,
      provider: session.provider,
      status: session.status,
      expire_at: session.expire_at,
    });
  } catch (error) {
    console.error("getSession error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}

async function loadPayableOrder(client, orderType, orderId, userId) {
  const table = orderType === "ticket" ? "ticketorders" : "productorders";
  const result = await client.query(
    `SELECT orderid, userid, totalamount, orderstatus, paymentstatus
       FROM ${table}
      WHERE orderid=$1 FOR UPDATE`,
    [orderId]
  );
  if (!result.rows.length) throw new Error("ORDER_NOT_FOUND");
  const order = result.rows[0];
  if (order.userid !== userId) throw new Error("FORBIDDEN");
  if (order.paymentstatus !== "unpaid" || order.orderstatus !== "pending") throw new Error("ORDER_NOT_PAYABLE");
  return order;
}

async function createVnpayPayment(req, res, orderType) {
  const userId = req.user.userId;
  const orderId = Number(req.body?.orderId);
  if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ message: "Missing orderId" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const order = await loadPayableOrder(client, orderType, orderId, userId);
    const txnRef = newTxnRef();
    const session = await client.query(
      `INSERT INTO paymentsessions(orderid, ticket_orderid, provider, status, userid, vnp_txn_ref, expire_at)
       VALUES($1,$2,'vnpay','pending',$3,$4,(CURRENT_TIMESTAMP + INTERVAL '15 minutes'))
       RETURNING id, expire_at`,
      [orderType === "product" ? orderId : null, orderType === "ticket" ? orderId : null, userId, txnRef]
    );
    const paymentUrl = createPaymentUrl({
      txnRef,
      amount: order.totalamount,
      orderInfo: `${orderType === "ticket" ? "Ticket" : "Product"} order ${orderId}`,
      req,
    });
    await client.query("COMMIT");
    return res.status(201).json({
      sessionId: session.rows[0].id,
      provider: "vnpay",
      paymentUrl,
      expireAt: session.rows[0].expire_at,
    });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    const status = ["ORDER_NOT_FOUND"].includes(error.message) ? 404 : ["FORBIDDEN"].includes(error.message) ? 403 : ["ORDER_NOT_PAYABLE", "VNPAY_NOT_CONFIGURED"].includes(error.message) ? 400 : 500;
    if (status === 500) console.error("createVnpayPayment error:", error.message);
    return res.status(status).json({
      message: error.message === "VNPAY_NOT_CONFIGURED" ? "VNPay Sandbox is not configured" : error.message,
    });
  } finally {
    client.release();
  }
}

async function markPaymentFromVnpay(query) {
  if (!verifyCallback(query)) return { code: "97", message: "Invalid signature" };

  const txnRef = String(query.vnp_TxnRef || "");
  const client = await pool.connect();
  let paidOrder = null;
  try {
    await client.query("BEGIN");
    const sessionResult = await client.query(
      `SELECT ps.*, po.totalamount AS product_total, po.userid AS product_userid,
              "to".totalamount AS ticket_total, "to".userid AS ticket_userid
         FROM paymentsessions ps
         LEFT JOIN productorders po ON po.orderid=ps.orderid
         LEFT JOIN ticketorders "to" ON "to".orderid=ps.ticket_orderid
        WHERE ps.vnp_txn_ref=$1 FOR UPDATE`,
      [txnRef]
    );
    if (!sessionResult.rows.length) {
      await client.query("ROLLBACK");
      return { code: "01", message: "Order not found" };
    }

    const session = sessionResult.rows[0];
    const totalAmount = session.orderid ? session.product_total : session.ticket_total;
    if (String(query.vnp_Amount || "") !== expectedAmount(totalAmount)) {
      await client.query("ROLLBACK");
      return { code: "04", message: "Invalid amount" };
    }
    if (session.status === "paid") {
      await client.query("ROLLBACK");
      return { code: "00", message: "Confirm Success", alreadyPaid: true, session };
    }
    if (session.status !== "pending") {
      await client.query("ROLLBACK");
      return { code: "02", message: "Order already confirmed" };
    }
    if (new Date(session.expire_at).getTime() < Date.now()) {
      await client.query(`UPDATE paymentsessions SET status='expired' WHERE id=$1`, [session.id]);
      await client.query("COMMIT");
      return { code: "02", message: "Order expired" };
    }

    const success = query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00";
    if (!success) {
      await client.query(
        `UPDATE paymentsessions SET status='failed', provider_txn_id=$1 WHERE id=$2`,
        [query.vnp_TransactionNo || null, session.id]
      );
      await client.query("COMMIT");
      return { code: "00", message: "Confirm Success", failed: true, session };
    }

    await client.query(
      `UPDATE paymentsessions SET status='paid', provider_txn_id=$1 WHERE id=$2`,
      [query.vnp_TransactionNo || null, session.id]
    );

    if (session.orderid) {
      const updated = await client.query(
        `UPDATE productorders
            SET paymentstatus='paid', paymentmethod='vnpay',
                orderstatus=CASE WHEN orderstatus='pending' THEN 'processing' ELSE orderstatus END
          WHERE orderid=$1 AND paymentstatus='unpaid'
          RETURNING orderid, userid, totalamount`,
        [session.orderid]
      );
      paidOrder = updated.rows[0] ? { type: "product", ...updated.rows[0] } : null;
    } else {
      const updated = await client.query(
        `UPDATE ticketorders
            SET paymentstatus='paid', paymentmethod='vnpay', orderstatus='confirmed'
          WHERE orderid=$1 AND paymentstatus='unpaid'
          RETURNING orderid, userid, totalamount`,
        [session.ticket_orderid]
      );
      if (updated.rows[0]) {
        const details = await client.query(
          `SELECT detailid, qrcodeurl FROM ticketorderdetails WHERE orderid=$1 FOR UPDATE`,
          [session.ticket_orderid]
        );
        for (const detail of details.rows) {
          if (!detail.qrcodeurl) {
            await client.query(`UPDATE ticketorderdetails SET qrcodeurl=$1 WHERE detailid=$2`, [crypto.randomUUID(), detail.detailid]);
          }
        }
        paidOrder = { type: "ticket", ...updated.rows[0] };
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("VNPay IPN processing error:", error.message);
    return { code: "99", message: "Unknown error" };
  } finally {
    client.release();
  }

  if (paidOrder?.type === "product") {
    try {
      await membership.activateFromPaidOrder({ orderId: paidOrder.orderid });
      const membershipProduct = await pool.query(
        `SELECT 1
           FROM productorderdetails d
           JOIN products p ON p.productid=d.productid
          WHERE d.orderid=$1 AND p.is_membership=true
          LIMIT 1`,
        [paidOrder.orderid]
      );
      if (membershipProduct.rows.length) {
        await pool.query(`UPDATE users SET membershiptier='premium', update_at=NOW() WHERE userid=$1`, [paidOrder.userid]);
      }
      await applyCashbackIfAny(paidOrder);
      await pool.query(`INSERT INTO notifications(userid, title, message) VALUES($1,$2,$3)`, [
        paidOrder.userid,
        "Thanh toán thành công",
        `Đơn #${paidOrder.orderid} đã được thanh toán qua VNPay.`,
      ]);
    } catch (error) {
      console.error("VNPay product side-effect error:", error.message);
    }
  }

  return { code: "00", message: "Confirm Success", paidOrder };
}

async function vnpayIpn(req, res) {
  try {
    const result = await markPaymentFromVnpay(req.query);
    return ipnResponse(res, result.code, result.message);
  } catch (error) {
    console.error("VNPay IPN error:", error.message);
    return ipnResponse(res, "99", "Unknown error");
  }
}

async function vnpayReturn(req, res) {
  const fallback = process.env.PAYMENT_FRONTEND_URL || "http://localhost:5173";
  try {
    const valid = verifyCallback(req.query);
    const txnRef = String(req.query.vnp_TxnRef || "");
    const sessionResult = txnRef
      ? await pool.query(`SELECT orderid, ticket_orderid FROM paymentsessions WHERE vnp_txn_ref=$1`, [txnRef])
      : { rows: [] };
    const session = sessionResult.rows[0];
    const path = session?.ticket_orderid ? `/ticket-orders/${session.ticket_orderid}` : session?.orderid ? `/orders/${session.orderid}` : "/";
    const result = valid ? "pending-confirmation" : "invalid";
    return res.redirect(`${fallback.replace(/\/$/, "")}${path}?vnpay=${result}`);
  } catch (error) {
    console.error("VNPay return error:", error.message);
    return res.redirect(`${fallback.replace(/\/$/, "")}/?vnpay=error`);
  }
}

async function webhook(req, res) {
  try {
    const secret = req.headers["x-webhook-secret"];
    if (String(secret || "") !== String(process.env.PAYMENT_WEBHOOK_SECRET || "")) {
      return res.status(401).send("unauthorized");
    }
    const payload = Buffer.isBuffer(req.body) ? JSON.parse(req.body.toString("utf8")) : req.body;
    if (payload?.type !== "topup.succeeded") return res.status(200).send("ignored");

    const data = payload.data || {};
    const topup = await pool.query(`SELECT userid FROM wallet_topups WHERE id=$1`, [Number(data.topupId)]);
    if (!topup.rows.length) return res.status(404).send("topup not found");
    await wallet.topupApplyWebhook({
      userId: topup.rows[0].userid,
      topupId: Number(data.topupId),
      provider: String(data.provider || "mock"),
      providerTxnId: String(data.providerTxnId || ""),
      amount: Number(data.amount),
    });
    return res.status(200).send("ok");
  } catch (error) {
    console.error("payment webhook error:", error.message);
    return res.status(400).send("bad request");
  }
}

module.exports = {
  createSession,
  getSession,
  createVnpayProduct: (req, res) => createVnpayPayment(req, res, "product"),
  createVnpayTicket: (req, res) => createVnpayPayment(req, res, "ticket"),
  vnpayIpn,
  vnpayReturn,
  webhook,
};
