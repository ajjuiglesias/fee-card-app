const db = require('../config/db');
const { generateReceipt } = require('../services/receiptGenerator');

// @desc    Create a new Fee Invoice for a Month
// @route   POST /api/invoices/create
const createInvoice = async (req, res) => {
    const { student_id, tutor_id, month_name, amount } = req.body;

    // 1. Check if invoice already exists for this student + month
    // (Prevents double charging)
    const existing = await db.query(
        'SELECT * FROM invoices WHERE student_id = $1 AND month_name = $2',
        [student_id, month_name]
    );

    if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Invoice for this month already exists.' });
    }

    try {
        // 2. Create the Invoice
        const result = await db.query(
            `INSERT INTO invoices (student_id, tutor_id, month_name, amount, status) 
             VALUES ($1, $2, $3, $4, 'PENDING') 
             RETURNING *`,
            [student_id, tutor_id, month_name, amount]
        );

        res.status(201).json({
            message: 'Fee Invoice Created!',
            invoice: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Mark an Invoice as PAID
// @route   PUT /api/invoices/:id/pay
const markInvoicePaid = async (req, res) => {
    const { id } = req.params; // Invoice ID

    try {
        const result = await db.query(
            `UPDATE invoices 
             SET status = 'PAID', paid_at = NOW() 
             WHERE id = $1 
             RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        res.json({
            message: 'Fee Marked as PAID!',
            invoice: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Generate and Download Receipt Image
// @route   GET /api/invoices/:id/receipt
const downloadReceipt = async (req, res) => {
    const { id } = req.params; // Invoice ID

    try {
        // 1. Get Invoice Details (Join with Student & Tutor to get names)
        const result = await db.query(
            `SELECT i.*, s.name as student_name, t.business_name 
             FROM invoices i
             JOIN students s ON i.student_id = s.id
             JOIN tutors t ON i.tutor_id = t.id
             WHERE i.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        const invoice = result.rows[0];

        // 2. Check if Paid
        if (invoice.status !== 'PAID') {
            return res.status(400).json({ error: 'Cannot generate receipt for Unpaid invoice' });
        }

        // 3. Generate Image Buffer
        const imageBuffer = await generateReceipt(
            invoice.student_name, 
            invoice.month_name, 
            invoice.amount, 
            invoice.business_name
        );

        // 4. Send Image as Response
        res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': imageBuffer.length
        });
        res.end(imageBuffer);

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// DON'T FORGET to export it!
module.exports = { createInvoice, markInvoicePaid, downloadReceipt };