const express = require('express');
const router = express.Router();
const {
    createBatch,
    getBatchesByTutor,
    updateBatch,
    deleteBatch
} = require('../controllers/batchController');

// Create a new batch
router.post('/create', createBatch);

// Get all batches for a tutor
router.get('/:tutorId', getBatchesByTutor);

// Update a batch
router.put('/:id', updateBatch);

// Delete a batch
router.delete('/:id', deleteBatch);

module.exports = router;
