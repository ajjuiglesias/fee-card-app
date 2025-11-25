const db = require('../config/db');

// @desc    Register a new Tutor
// @route   POST /api/tutors/register
const registerTutor = async (req, res) => {
    // 1. Get data from the frontend (Body)
    const { full_name, phone, business_name, upi_id } = req.body;

    // 2. Simple Validation
    if (!full_name || !phone || !upi_id) {
        return res.status(400).json({ error: 'Please provide Name, Phone, and UPI ID' });
    }

    try {
        // 3. Insert into Database
        const result = await db.query(
            `INSERT INTO tutors (full_name, phone, business_name, upi_id) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`, 
            [full_name, phone, business_name, upi_id]
        );

        // 4. Send back the new Tutor data
        res.status(201).json({
            message: 'Tutor Registered!',
            tutor: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        // Handle duplicate phone number error
        if (error.code === '23505') {
            return res.status(400).json({ error: 'This phone number is already registered.' });
        }
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = { registerTutor };