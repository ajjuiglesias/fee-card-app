require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const db = require('./config/db');
const tutorRoutes = require('./routes/tutorRoutes');
const studentRoutes = require('./routes/studentRoutes');
const invoiceRoutes = require('./routes/invoiceRoutes');
const initCronJobs = require('./cron/reminderCron');
const { handleRazorpayWebhook } = require('./controllers/webhookController');

const app = express();

// --- 1. MIDDLEWARE (The Security Layer) ---
app.use(helmet()); // Secure HTTP headers
app.use(cors());   // Allow cross-origin requests
app.use(express.json()); // Parse JSON bodies
app.use(morgan('dev')); // Log requests
app.use('/api/tutors', tutorRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/invoices', invoiceRoutes); 

// Start the Automated Reminders
initCronJobs();

// Webhook Route (Must be POST)
app.post('/api/webhooks/razorpay', handleRazorpayWebhook);

// --- 2. HEALTH CHECK ROUTE ---
// Use this to verify your server is alive
app.get('/', async (req, res) => {
    try {
        // Test DB connection
        const result = await db.query('SELECT NOW()'); 
        res.json({ 
            status: 'Active', 
            db_time: result.rows[0].now 
        });
    } catch (error) {
        res.status(500).json({ status: 'Error', error: error.message });
    }
});

// --- 3. START SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});