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
const img1Path = 'C:/Users/Gaurav Kumar/Pictures/Camera Roll/WIN_20251004_16_06_53_Pro.jpg';
const img2Path = 'c:/Users/Gaurav Kumar/Pictures/MyPhotos/WhatsApp Image 2025-10-23 at 09.46.32_c2a39054.jpg';

// Encode both images
const img1Base64 = encodeImageToBase64(img1Path);
const img2Base64 = encodeImageToBase64(img2Path);

// Send request to AI server
async function verifyFaces(img1_base64, img2_base64) {
  try {
    const response = await axios.post('http://localhost:8000/verify_faces/', {
      img1_base64,
      img2_base64
    });

    console.log('Verification Result:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

verifyFaces(img1Base64, img2Base64);