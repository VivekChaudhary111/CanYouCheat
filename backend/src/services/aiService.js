const axios = require('axios');
const FormData = require('form-data');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function verifyFacesWithAI(liveImageBase64, referenceImageBase64) {
    const url = `${AI_SERVICE_URL}/verify_faces/`;
    const payload = {
        img1_base64: liveImageBase64,
        img2_base64: referenceImageBase64
    };
    const response = await axios.post(url, payload, { timeout: 20000 });
    return response.data;
}

// ✅ FIX: Convert base64 to file and send as multipart/form-data
async function analyzeFrameWithAI(base64Image) {
    try {
        console.log('🤖 Converting base64 to buffer for AI service...');
        
        // Clean base64 string
        let cleanBase64 = base64Image;
        if (base64Image.startsWith('data:image')) {
            cleanBase64 = base64Image.split(',')[1];
        }
        
        // Convert base64 to buffer
        const imageBuffer = Buffer.from(cleanBase64, 'base64');
        console.log('✅ Image buffer created:', imageBuffer.length, 'bytes');
        
        // Create form data
        const formData = new FormData();
        formData.append('file', imageBuffer, {
            filename: 'frame.jpg',
            contentType: 'image/jpeg'
        });
        
        console.log('📸 Sending to AI service /proctor as file upload...');
        
        // Send as multipart/form-data (matching your AI service expectation)
        const response = await axios.post(`${AI_SERVICE_URL}/proctor`, formData, {
            timeout: 15000,
            headers: {
                ...formData.getHeaders()  // Important: get form-data headers
            }
        });
        
        console.log('✅ AI service responded successfully');
        return response.data;
        
    } catch (error) {
        console.error('❌ AI service error:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = {
    verifyFacesWithAI,
    analyzeFrameWithAI,
};