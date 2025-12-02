import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from './src/config/gemini.js';

async function listModels() {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // Just to get the object, though listModels is on genAI? 
        // Actually listModels is usually on the client or manager.
        // The SDK might not have a direct listModels method on the main class easily accessible without looking up docs.
        // But let's try a simple generation with a very basic model name "gemini-1.0-pro"

        console.log("Trying gemini-2.5-pro...");
        const modelFlash = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
        const result = await modelFlash.generateContent("Hello");
        console.log("Success with gemini-2.5-pro:", await result.response.text());

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
