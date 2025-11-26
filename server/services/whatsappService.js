const axios = require('axios');

/**
 * WhatsApp Business API Service
 * Sends messages using Meta's WhatsApp Business Platform
 */

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

/**
 * Send a simple payment reminder using template
 * @param {string} phoneNumber - Recipient phone number (with country code, no +)
 * @param {string} studentName - Name of the student
 * @param {string} amount - Amount due
 * @returns {Promise<object>} Response from WhatsApp API
 */
async function sendPaymentReminder(phoneNumber, studentName, amount) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        console.warn('⚠️ WhatsApp credentials not configured. Skipping WhatsApp message.');
        return {
            success: false,
            error: 'WhatsApp credentials not configured'
        };
    }

    // Ensure phone number is in correct format (no + or spaces)
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');

    console.log(`📱 Sending WhatsApp reminder to ${formattedPhone} for ${studentName}`);

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'template',
                template: {
                    name: 'payment_reminder_simple',
                    language: {
                        code: 'en'
                    },
                    components: [
                        {
                            type: 'body',
                            parameters: [
                                {
                                    type: 'text',
                                    text: studentName
                                },
                                {
                                    type: 'text',
                                    text: amount
                                }
                            ]
                        }
                    ]
                }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('✅ WhatsApp message sent successfully:', response.data);
        return {
            success: true,
            messageId: response.data.messages[0].id,
            data: response.data
        };

    } catch (error) {
        console.error('❌ WhatsApp send error:', error.response?.data || error.message);

        return {
            success: false,
            error: error.response?.data?.error || error.message,
            details: error.response?.data
        };
    }
}

/**
 * Send a plain text message (fallback for non-template messages)
 * @param {string} to - Recipient phone number
 * @param {string} messageBody - Message text
 * @returns {Promise<object>} Response
 */
async function sendMessage(to, messageBody) {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
        console.warn('⚠️ WhatsApp credentials not configured.');
        return { success: false };
    }

    const formattedPhone = to.replace(/[^0-9]/g, '');

    try {
        const response = await axios.post(
            `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
            {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'text',
                text: { body: messageBody }
            },
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log(`✅ Message sent to ${to}`);
        return { success: true, data: response.data };
    } catch (error) {
        console.error('❌ WhatsApp API Error:', error.response?.data || error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Send image with caption
 * @param {string} to - Recipient phone number
 * @param {string} imageUrl - Public URL of image
 * @param {string} caption - Image caption
 * @returns {Promise<object>} Response
 */
async function sendImage(to, imageUrl, caption) {
    // For now, send as text message with link
    const message = `${caption}\n\nDownload here: ${imageUrl}`;
    return sendMessage(to, message);
}

/**
 * Send a test message to verify WhatsApp integration
 * @param {string} phoneNumber - Test phone number
 * @returns {Promise<object>} Response from WhatsApp API
 */
async function sendTestMessage(phoneNumber) {
    return sendPaymentReminder(phoneNumber, 'Test Student', '500');
}

module.exports = {
    sendPaymentReminder,
    sendTestMessage,
    sendMessage,
    sendImage
};