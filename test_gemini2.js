import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const apiKey = 'AQ.Ab8RN6KEirjabSw6-R-7xXUgDKpRaok51CZYK0K7OrhNz7Z0dA';
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
    const result = await model.generateContent("Hello.");
    console.log("PRO:", result.response.text());
  } catch (error) {
    console.error('PRO ERROR:', error.statusText, error.message);
  }
}

test();
