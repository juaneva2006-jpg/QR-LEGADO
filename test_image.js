import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

async function test() {
  const apiKey = 'AQ.Ab8RN6KEirjabSw6-R-7xXUgDKpRaok51CZYK0K7OrhNz7Z0dA';
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Create a dummy 1x1 png image
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==";
    
    const imageParts = [
      {
        inlineData: {
          data: base64Image,
          mimeType: "image/png"
        }
      }
    ];

    console.log("Sending request...");
    const result = await model.generateContent(["Describe this image", ...imageParts]);
    console.log("RESPONSE:", result.response.text());
  } catch (error) {
    console.error('ERROR:', error);
  }
}

test();
