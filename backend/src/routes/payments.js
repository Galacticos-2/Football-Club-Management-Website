const express = require("express");
const { authMiddleware } = require("../middleware/authmiddleware");
const ctrl = require("../controllers/paymentscontroller");

const router = express.Router();

router.post("/session", authMiddleware, ctrl.createSession);
router.get("/session/:id", authMiddleware, ctrl.getSession);
router.post("/vnpay/product", authMiddleware, ctrl.createVnpayProduct);
router.post("/vnpay/ticket", authMiddleware, ctrl.createVnpayTicket);
router.post("/webhook", ctrl.webhook);

// VNPay calls this endpoint server-to-server. IPN, not browser return, changes order state.
router.get("/vnpay/ipn", ctrl.vnpayIpn);
router.get("/vnpay/return", ctrl.vnpayReturn);

module.exports = router;
