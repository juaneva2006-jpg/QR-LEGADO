import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const apiKey = 'AQ.FakeKey123123123';
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello.");
    console.log("FAKE:", result.response.text());
  } catch (error) {
    console.error('FAKE ERROR:', error.statusText, error.message);
  }
}

test();
