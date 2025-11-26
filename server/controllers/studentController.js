const db = require('../config/db');

// @desc    Add a Student linked to a Tutor
// @route   POST /api/students/add
const addStudent = async (req, res) => {
    const { tutor_id, name, parent_phone, standard_fee } = req.body;

    // 1. Validation
    if (!tutor_id || !name || !parent_phone || !standard_fee) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // 2. Insert into Database
        const result = await db.query(
            `INSERT INTO students (tutor_id, name, parent_phone, standard_fee) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [tutor_id, name, parent_phone, standard_fee]
        );

        // 3. Success Response
        res.status(201).json({
            message: 'Student Added Successfully!',
            student: result.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Get all students for a specific Tutor
// @route   GET /api/students/:tutorId
const getStudentsByTutor = async (req, res) => {
    const { tutorId } = req.params;

    try {
        const result = await db.query(
            'SELECT * FROM students WHERE tutor_id = $1 ORDER BY name ASC',
            [tutorId]
const db = require('../config/db');

        // @desc    Add a Student linked to a Tutor
        // @route   POST /api/students/add
        const addStudent = async (req, res) => {
            const { tutor_id, name, parent_phone, standard_fee } = req.body;

            // 1. Validation
            if (!tutor_id || !name || !parent_phone || !standard_fee) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            try {
                // 2. Insert into Database
                const result = await db.query(
                    `INSERT INTO students (tutor_id, name, parent_phone, standard_fee) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
                    [tutor_id, name, parent_phone, standard_fee]
                );

                // 3. Success Response
                res.status(201).json({
                    message: 'Student Added Successfully!',
                    student: result.rows[0]
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Server Error' });
            }
        };

        // @desc    Get all students for a specific Tutor
        // @route   GET /api/students/:tutorId
        const getStudentsByTutor = async (req, res) => {
            const { tutorId } = req.params;

            try {
                const result = await db.query(
                    'SELECT * FROM students WHERE tutor_id = $1 ORDER BY name ASC',
                    [tutorId]
                );
                res.json(result.rows);
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Server Error' });
            }
        };

        // @desc    Delete a student and all their invoices
        // @route   DELETE /api/students/:id
        const deleteStudent = async (req, res) => {
            const { id } = req.params;

            try {
                // 1. Delete all invoices for this student (CASCADE)
                await db.query('DELETE FROM invoices WHERE student_id = $1', [id]);

                // 2. Delete the student
                const result = await db.query(
                    'DELETE FROM students WHERE id = $1 RETURNING *',
                    [id]
                );

                if (result.rows.length === 0) {
                    return res.status(404).json({ error: 'Student not found' });
                }

                res.json({
                    message: 'Student deleted successfully',
                    student: result.rows[0]
                });

            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Server Error' });
            }
        };

        module.exports = { addStudent, getStudentsByTutor, deleteStudent };