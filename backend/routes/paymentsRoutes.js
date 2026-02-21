const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/create-order
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'INR' } = req.body;
        if (!amount || amount < 100) return res.status(400).json({ error: 'Minimum amount is ₹1 (100 paise)' });

        const order = await razorpay.orders.create({
            amount: Math.round(amount),
            currency,
            receipt: `iro_${Date.now()}`,
        });

        return res.status(200).json(order);
    } catch (err) {
        console.error('Razorpay create order error:', err.message);
        res.status(500).json({ error: err.message || 'Payment gateway error' });
    }
});

// POST /api/payments/verify — optional webhook signature check
router.post('/verify', (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET;
        const expected = crypto
            .createHmac('sha256', secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (expected === razorpay_signature) {
            return res.status(200).json({ verified: true });
        }
        return res.status(400).json({ verified: false, error: 'Signature mismatch' });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

module.exports = router;
