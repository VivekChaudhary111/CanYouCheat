const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const FRAME_PATH = 'C:\\Users\\Gaurav Kumar\\Pictures\\testing images\\images.webp';

const form = new FormData();
form.append('file', fs.createReadStream(FRAME_PATH), path.basename(FRAME_PATH));

axios.post('http://localhost:8000/proctor', form, {
  headers: form.getHeaders(),
  maxContentLength: Infinity,
  maxBodyLength: Infinity
})
.then(res => {
  console.log('✅ Proctor Response:', res.data);
})
.catch(err => {
  console.error('❌ Upload Error:', err.response ? err.response.data : err.message);
});