const axios = require('axios');
require('dotenv').config();

const sendMessage = async (to, messageBody) => {
    try {
        // You need a Meta Developer Account for this
        const url = `https://graph.facebook.com/v17.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
        
        await axios.post(url, {
            messaging_product: "whatsapp",
            to: to, // Format: 919876543210
            type: "text",
            text: { body: messageBody }
        }, {
            headers: {
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json"
            }
        });
        console.log(`Message sent to ${to}`);
    } catch (error) {
        console.error("WhatsApp API Error:", error.response ? error.response.data : error.message);
    }
};

const sendImage = async (to, imageUrl, caption) => {
    // Logic to send the receipt image
    // (Requires uploading image to Meta first or sending public URL)
    // For MVP, we can send a link to the receipt
    const message = `${caption}\n\nDownload here: ${imageUrl}`;
    await sendMessage(to, message);
};

module.exports = { sendMessage, sendImage };