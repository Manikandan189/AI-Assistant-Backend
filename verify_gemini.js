import { aiService } from './src/services/aiService.js';

async function testGemini() {
    console.log("Testing Gemini AI Integration...");

    try {
        const summary = await aiService.analyzeFile(
            "console.log('Hello World'); function add(a, b) { return a + b; }",
            "test.js"
        );

        console.log("Analysis Result:");
        console.log(summary);

        if (summary && summary.length > 0) {
            console.log("✅ Gemini API test passed!");
        } else {
            console.error("❌ Gemini API returned empty summary.");
        }
    } catch (error) {
        console.error("❌ Gemini API test failed:", error);
    }
}

testGemini();
