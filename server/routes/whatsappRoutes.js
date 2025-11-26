const express = require('express');
const router = express.Router();
const { sendTestMessage } = require('../services/whatsappService');

// @desc    Test WhatsApp integration
// @route   POST /api/whatsapp/test
router.post('/test', async (req, res) => {
    const { phone_number } = req.body;

    if (!phone_number) {
        return res.status(400).json({ error: 'Phone number is required' });
    }

    console.log(`🧪 Testing WhatsApp integration with ${phone_number}`);

    try {
        const result = await sendTestMessage(phone_number);

        if (result.success) {
            res.json({
                success: true,
                message: 'Test message sent successfully!',
                messageId: result.messageId
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error,
                details: result.details
            });
        }
    } catch (error) {
        console.error('Test error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
