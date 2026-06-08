const FormData = require('form-data');

async function test() {
  const form = new FormData();
  const buffer = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==", "base64");
  form.append('file', buffer, { filename: 'test.png', contentType: 'image/png' });

  try {
    const res = await fetch('http://localhost:3000/legado/api/ocr/', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("RESPONSE:", text);
  } catch(e) {
    console.error("ERROR:", e);
  }
}
test();
