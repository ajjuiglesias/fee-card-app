const express = require('express');
const router = express.Router();
const { createInvoice, markInvoicePaid, downloadReceipt } = require('../controllers/invoiceController');

router.post('/create', createInvoice);
router.put('/:id/pay', markInvoicePaid);
router.get('/:id/receipt', downloadReceipt);

module.exports = router;