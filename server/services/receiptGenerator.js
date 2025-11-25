const { createCanvas } = require('canvas');

const generateReceipt = async (studentName, month, amount, tutorName) => {
    // 1. Setup Canvas (Phone Screen Size mostly)
    const width = 800;
    const height = 1000;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // 2. Draw Background (White)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 3. Draw Header (Blue)
    ctx.fillStyle = '#2563eb'; // Blue-600
    ctx.fillRect(0, 0, width, 150);

    // 4. Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FEE RECEIPT', width / 2, 100);

    // 5. Draw "Green Tick" Circle
    ctx.beginPath();
    ctx.arc(width / 2, 300, 80, 0, Math.PI * 2, true);
    ctx.fillStyle = '#dcfce7'; // Light Green
    ctx.fill();
    ctx.closePath();

    // Draw the Tick (Simple V shape)
    ctx.beginPath();
    ctx.moveTo(width / 2 - 40, 300);
    ctx.lineTo(width / 2 - 10, 340);
    ctx.lineTo(width / 2 + 50, 260);
    ctx.lineWidth = 15;
    ctx.strokeStyle = '#16a34a'; // Green-600
    ctx.stroke();

    // 6. Draw Status Text
    ctx.fillStyle = '#16a34a';
    ctx.font = 'bold 60px Arial';
    ctx.fillText('PAID', width / 2, 450);

    // 7. Student Details
    ctx.fillStyle = '#333333';
    ctx.font = '40px Arial';
    ctx.textAlign = 'left';
    
    const startX = 100;
    let startY = 600;
    const gap = 80;

    // Name
    ctx.fillStyle = '#6b7280'; // Gray
    ctx.fillText('Student Name:', startX, startY);
    ctx.fillStyle = '#000000'; // Black
    ctx.fillText(studentName, startX, startY + 45);

    startY += gap + 40;

    // Amount
    ctx.fillStyle = '#6b7280';
    ctx.fillText('Amount Paid:', startX, startY);
    ctx.fillStyle = '#000000';
    ctx.fillText(`₹${amount}`, startX, startY + 45);

    // Tutor Signature
    ctx.fillStyle = '#9ca3af';
    ctx.font = 'italic 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Authorized by: ${tutorName}`, width / 2, 900);
    ctx.fillText(`Month: ${month}`, width / 2, 950);

    // 8. Return Buffer (The raw image data)
    return canvas.toBuffer('image/png');
};

module.exports = { generateReceipt };