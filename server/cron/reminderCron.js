const cron = require('node-cron');
const db = require('../config/db');
const { sendMessage } = require('../services/whatsappService');

const initCronJobs = () => {
    // Run every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        const today = new Date();
        const day = today.getDate();

        // Run only on 1st, 5th, 10th
        if ([1, 5, 10].includes(day)) {
            console.log(`Running Reminder Cron for Day ${day}...`);
            
            try {
                // 1. Find students who haven't paid for this month
                const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });
                
                const result = await db.query(`
                    SELECT s.id, s.name, s.parent_phone, s.standard_fee, t.business_name, t.upi_id 
                    FROM students s
                    JOIN tutors t ON s.tutor_id = t.id
                    WHERE s.id NOT IN (
                        SELECT student_id FROM invoices 
                        WHERE month_name = $1 AND status = 'PAID'
                    )
                `, [monthName]);

                const unpaidStudents = result.rows;

                // 2. Send WhatsApp Reminder to each
                for (const student of unpaidStudents) {
                    // Generate Payment Link (Pointing to your App)
                    // NOTE: Update with your actual deployed domain
                    const baseUrl = process.env.APP_BASE_URL || "https://fee-card-app.vercel.app"; 
                    const params = new URLSearchParams({
                        pa: student.upi_id,
                        pn: student.business_name,
                        am: student.standard_fee,
                        tn: `Fee for ${student.name}`
                    });
                    
                    const paymentLink = `${baseUrl}/pay?${params.toString()}`;

                    const message = `📅 *Fee Reminder: Day ${day}*\n\nDear Parent, fees for ${student.name} (₹${student.standard_fee}) for ${monthName} is pending.\n\nPlease pay securely via this link:\n${paymentLink}`;

                    await sendMessage(student.parent_phone, message);
                }

            } catch (error) {
                console.error("Cron Job Error:", error);
            }
        }
    });
};

module.exports = initCronJobs;