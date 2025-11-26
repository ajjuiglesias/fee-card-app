const db = require('../config/db');
const crypto = require('crypto');
const { sendImage } = require('../services/whatsappService');

const handleRazorpayWebhook = async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    
    // 1. Verify Signature (Security)
    const shasum = crypto.createHmac('sha256', secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    if (digest === req.headers['x-razorpay-signature']) {
        console.log('Webhook Verified');
        
        const event = req.body.event;
        
        // 2. Handle Payment Captured
        if (event === 'payment.captured') {
            const payment = req.body.payload.payment.entity;
            // You would pass the student_id in 'notes' when creating the order
            const { student_id, month_name } = payment.notes; 

            try {
                // A. Mark Invoice as PAID in DB
                const invoiceRes = await db.query(
                    `UPDATE invoices SET status = 'PAID', paid_at = NOW() 
                     WHERE student_id = $1 AND month_name = $2
                     RETURNING id`,
                    [student_id, month_name]
                );
                
                const invoiceId = invoiceRes.rows[0].id;

                // B. Get Parent Details for WhatsApp
                const studentRes = await db.query('SELECT parent_phone, name FROM students WHERE id = $1', [student_id]);
                const { parent_phone, name } = studentRes.rows[0];

                // C. Send "Green Tick" Receipt
                const receiptLink = `${process.env.API_URL}/invoices/${invoiceId}/receipt`;
                await sendImage(parent_phone, receiptLink, `✅ Payment Received for ${name}! Here is your receipt.`);

            } catch (err) {
                console.error("Webhook Logic Error", err);
            }
        }
        res.json({ status: 'ok' });
    } else {
        res.status(400).send('Invalid Signature');
    }
};

module.exports = { handleRazorpayWebhook };