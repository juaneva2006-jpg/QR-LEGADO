import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  const apiKey = 'AQ.Ab8RN6KEirjabSw6-R-7xXUgDKpRaok51CZYK0K7OrhNz7Z0dA';
  console.log('Testing with key:', apiKey);
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello, say 'Test successful' if you can read this.");
    console.log(result.response.text());
  } catch (error) {
    console.error('ERROR:', error);
  }
}

test();
