const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Helper to convert image to base64 with data URI prefix
function encodeImageToBase64(filePath) {
  const ext = path.extname(filePath).slice(1); // e.g., 'jpg'
  const base64 = fs.readFileSync(filePath, { encoding: 'base64' });
  return `data:image/${ext};base64,${base64}`;
}

// Paths to your test images
const img1Path = 'D:/pictures/20210723_172114~2.jpg';
const img2Path = 'D:/pictures/PhotoStudio_1673431524686.jpeg';

// Encode both images
const img1Base64 = encodeImageToBase64(img1Path);
const img2Base64 = encodeImageToBase64(img2Path);

// Send request to AI server
async function verifyFaces(img1_base64, img2_base64) {
  try {
    const response = await axios.post('https://vivekchaudhary111-canyoucheat-ai.hf.space/verify_faces/', {
      img1_base64:img1_base64,
      img2_base64:img2_base64
    });

    console.log('Verification Result:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

verifyFaces(img1Base64, img2Base64);