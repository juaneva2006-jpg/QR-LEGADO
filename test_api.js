const fs = require('fs');
const FormData = require('form-data');

async function test() {
  const form = new FormData();
  // Create a dummy image
  const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==", "base64");
  form.append('file', buffer, { filename: 'test.png', contentType: 'image/png' });

  try {
    const res = await fetch('http://localhost:3000/api/ocr', {
      method: 'POST',
      body: form
    });
    
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("RESPONSE:", text);
  } catch(e) {
    console.error("ERROR:", e);
  }
}
test();
