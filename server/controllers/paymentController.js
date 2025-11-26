const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const { generateReceipt } = require('../services/receiptGenerator');

// Initialize Razorpay instance
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Create Razorpay Order
// @route   POST /api/payment/order
const createOrder = async (req, res) => {
    const { amount, student_id, tutor_id, month_name } = req.body;

    console.log('📥 Payment order request received:', { amount, student_id, tutor_id, month_name });

    if (!amount || !student_id || !tutor_id || !month_name) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // 1. Check if invoice already exists for this student + month
        console.log('🔍 Checking for existing invoice...');
        const existing = await db.query(
            'SELECT * FROM invoices WHERE student_id = $1 AND month_name = $2',
            [student_id, month_name]
        );
        console.log(`✅ Database query successful. Found ${existing.rows.length} existing invoices`);

        let invoiceId;

        if (existing.rows.length > 0) {
            // Invoice exists - check if already paid
            if (existing.rows[0].status === 'PAID') {
                console.log('⚠️ Invoice already paid');
                return res.status(400).json({ error: 'This month has already been paid' });
            }
            invoiceId = existing.rows[0].id;
            console.log('📋 Using existing invoice:', invoiceId);
        } else {
            // 2. Create Invoice in Database (status: PENDING)
            console.log('📝 Creating new invoice in database...');
            const invoiceResult = await db.query(
                `INSERT INTO invoices (student_id, tutor_id, month_name, amount, status) 
                 VALUES ($1, $2, $3, $4, 'PENDING') 
                 RETURNING id`,
                [student_id, tutor_id, month_name, amount]
            );
            invoiceId = invoiceResult.rows[0].id;
            console.log('✅ Invoice created:', invoiceId);
        }

        // 3. Create Razorpay Order
        console.log('💳 Creating Razorpay order...');
        const options = {
            amount: parseFloat(amount) * 100, // Convert to paise
            currency: 'INR',
            receipt: `receipt_${invoiceId}`,
            notes: {
                student_id: student_id,
                tutor_id: tutor_id,
                month_name: month_name,
                invoice_id: invoiceId
            }
        };
        console.log('Razorpay options:', { ...options, amount: options.amount + ' paise' });

        const order = await razorpay.orders.create(options);
        console.log('✅ Razorpay order created:', order.id);

        // 4. Return Order Details to Frontend
        const response = {
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            key_id: process.env.RAZORPAY_KEY_ID
        };
        console.log('📤 Sending response to frontend:', response);
        res.json(response);

    } catch (error) {
        console.error('❌ Create Order Error:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        res.status(500).json({
            error: 'Failed to create payment order',
            details: error.message,
            type: error.name
        });
    }
};

// @desc    Verify Razorpay Payment
// @route   POST /api/payment/verify
const verifyPayment = async (req, res) => {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment details' });
    }

    try {
        // 1. Verify Signature (Security Check)
        const sign = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(sign.toString())
            .digest('hex');

        if (razorpay_signature !== expectedSign) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }

        // 2. Fetch Payment Details from Razorpay
        const payment = await razorpay.payments.fetch(razorpay_payment_id);

        if (payment.status !== 'captured') {
            return res.status(400).json({ error: 'Payment not captured' });
        }

        // 3. Get Invoice ID from payment notes
        const { invoice_id, student_id } = payment.notes;

        // 4. Mark Invoice as PAID in Database
        await db.query(
            `UPDATE invoices 
             SET status = 'PAID', paid_at = NOW() 
             WHERE id = $1`,
            [invoice_id]
        );

        // 5. Get Student and Tutor Details for Receipt
        const invoiceData = await db.query(
            `SELECT i.*, s.name as student_name, s.parent_phone, t.business_name 
             FROM invoices i
             JOIN students s ON i.student_id = s.id
             JOIN tutors t ON i.tutor_id = t.id
             WHERE i.id = $1`,
            [invoice_id]
        );

        const invoice = invoiceData.rows[0];

        // 6. Generate Receipt
        const receiptBuffer = await generateReceipt(
            invoice.student_name,
            invoice.month_name,
            invoice.amount,
            invoice.business_name
        );

        // 7. In production, you would send this via WhatsApp
        // For now, we'll just return success
        // You can integrate WhatsApp API here if needed

        res.json({
            status: 'success',
            message: 'Payment verified successfully',
            invoice_id: invoice_id,
            receipt_url: `${process.env.API_URL || 'http://localhost:5000'}/api/invoices/${invoice_id}/receipt`
        });

    } catch (error) {
        console.error('Verify Payment Error:', error);
        res.status(500).json({ error: 'Payment verification failed', details: error.message });
    }
};

module.exports = { createOrder, verifyPayment };
