const axios = require('axios');

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

async function analyzeFrameWithAI(imageBuffer) {
	const url = `${AI_SERVICE_URL}/proctor`;
	const formData = new (require('form-data'))();
	formData.append('file', imageBuffer, { filename: 'frame.jpg', contentType: 'image/jpeg' });
	const response = await axios.post(url, formData, {
		headers: formData.getHeaders(),
		timeout: 15000
	});
	return response.data;
}

module.exports = {
	verifyFacesWithAI,
	analyzeFrameWithAI,
};


