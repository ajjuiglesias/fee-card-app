const cron = require('node-cron');
const db = require('../config/db');
const { sendPaymentReminder } = require('../services/whatsappService');

const initCronJobs = () => {
    // Run every day at 9:00 AM (changed from 10 AM to 9 AM)
    // Cron format: minute hour day month dayOfWeek
    // '0 9 1,5,10 * *' means: At 9:00 AM on 1st, 5th, and 10th of every month
    cron.schedule('0 9 1,5,10 * *', async () => {
        const today = new Date();
        const day = today.getDate();
        const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

        console.log(`\n🔔 ========================================`);
        console.log(`📅 Running Payment Reminder Cron - Day ${day}`);
        console.log(`📆 Month: ${monthName}`);
        console.log(`🔔 ========================================\n`);

        try {
            // 1. Find students who haven't paid for this month
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
            console.log(`📊 Found ${unpaidStudents.length} unpaid students`);

            if (unpaidStudents.length === 0) {
                console.log('✅ No unpaid students. All caught up!');
                return;
            }

            let successCount = 0;
            let failCount = 0;
            let skipCount = 0;

            // 2. Send WhatsApp Reminder to each unpaid student
            for (const student of unpaidStudents) {
                try {
                    // Check if reminder already sent for this student, month, and day
                    const reminderCheck = await db.query(`
                        SELECT id FROM payment_reminders 
                        WHERE student_id = $1 AND month_name = $2 AND reminder_day = $3
                    `, [student.id, monthName, day]);

                    if (reminderCheck.rows.length > 0) {
                        console.log(`⏭️  Skipping ${student.name} - reminder already sent on day ${day}`);
                        skipCount++;
                        continue;
                    }

                    // Send WhatsApp reminder using Business API template
                    console.log(`📱 Sending reminder to ${student.name} (${student.parent_phone})`);

                    const result = await sendPaymentReminder(
                        student.parent_phone,
                        student.name,
                        student.standard_fee
                    );

                    if (result.success) {
                        // Log successful reminder
                        await db.query(`
                            INSERT INTO payment_reminders 
                            (student_id, month_name, reminder_date, reminder_day, status, message_id)
                            VALUES ($1, $2, $3, $4, 'sent', $5)
                        `, [student.id, monthName, today, day, result.messageId]);

                        console.log(`✅ Reminder sent to ${student.name}`);
                        successCount++;
                    } else {
                        // Log failed reminder
                        await db.query(`
                            INSERT INTO payment_reminders 
                            (student_id, month_name, reminder_date, reminder_day, status, error_message)
                            VALUES ($1, $2, $3, $4, 'failed', $5)
                        `, [student.id, monthName, today, day, result.error]);

                        console.log(`❌ Failed to send to ${student.name}: ${result.error}`);
                        failCount++;
                    }

                    // Small delay to avoid rate limiting (500ms between messages)
                    await new Promise(resolve => setTimeout(resolve, 500));

                } catch (error) {
                    console.error(`❌ Error processing ${student.name}:`, error.message);
                    failCount++;
                }
            }

            console.log(`\n📊 Reminder Summary:`);
            console.log(`   ✅ Sent: ${successCount}`);
            console.log(`   ❌ Failed: ${failCount}`);
            console.log(`   ⏭️  Skipped: ${skipCount}`);
            console.log(`🔔 ========================================\n`);

        } catch (error) {
            console.error('❌ Cron Job Error:', error);
        }
    });

    console.log('✅ Cron job initialized: Payment reminders will run at 9:00 AM on 1st, 5th, and 10th of each month');
};

module.exports = initCronJobs;