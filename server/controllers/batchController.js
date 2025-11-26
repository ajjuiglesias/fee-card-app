const db = require('../config/db');

// @desc    Create a new batch
// @route   POST /api/batches/create
const createBatch = async (req, res) => {
    const { tutor_id, name, description, standard_fee } = req.body;

    console.log('📥 Create batch request:', { tutor_id, name, description, standard_fee });

    if (!tutor_id || !name) {
        console.log('❌ Missing required fields');
        return res.status(400).json({ error: 'Tutor ID and batch name are required' });
    }

    try {
        console.log('💾 Inserting batch into database...');
        const result = await db.query(
            `INSERT INTO batches (tutor_id, name, description, standard_fee) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [tutor_id, name, description, standard_fee]
        );

        console.log('✅ Batch created successfully:', result.rows[0]);
        res.status(201).json({
            message: 'Batch created successfully',
            batch: result.rows[0]
        });
    } catch (error) {
        console.error('❌ Create batch error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail
        });
        res.status(500).json({
            error: 'Server Error',
            details: error.message
        });
    }
};

// @desc    Get all batches for a tutor
// @route   GET /api/batches/:tutorId
const getBatchesByTutor = async (req, res) => {
    const { tutorId } = req.params;

    try {
        const result = await db.query(
            `SELECT b.*, 
                    COUNT(s.id) as student_count
             FROM batches b
             LEFT JOIN students s ON b.id = s.batch_id
             WHERE b.tutor_id = $1
             GROUP BY b.id
             ORDER BY b.created_at DESC`,
            [tutorId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get batches error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Update a batch
// @route   PUT /api/batches/:id
const updateBatch = async (req, res) => {
    const { id } = req.params;
    const { name, description, standard_fee } = req.body;

    try {
        const result = await db.query(
            `UPDATE batches 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 standard_fee = COALESCE($3, standard_fee)
             WHERE id = $4
             RETURNING *`,
            [name, description, standard_fee, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        res.json({
            message: 'Batch updated successfully',
            batch: result.rows[0]
        });
    } catch (error) {
        console.error('Update batch error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

// @desc    Delete a batch (students' batch_id set to NULL)
// @route   DELETE /api/batches/:id
const deleteBatch = async (req, res) => {
    const { id } = req.params;

    try {
        // Students' batch_id will be set to NULL automatically (ON DELETE SET NULL)
        const result = await db.query(
            'DELETE FROM batches WHERE id = $1 RETURNING *',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        res.json({
            message: 'Batch deleted successfully. Students remain but are no longer in this batch.',
            batch: result.rows[0]
        });
    } catch (error) {
        console.error('Delete batch error:', error);
        res.status(500).json({ error: 'Server Error' });
    }
};

module.exports = {
    createBatch,
    getBatchesByTutor,
    updateBatch,
    deleteBatch
};
