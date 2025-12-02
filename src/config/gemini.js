import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const geminiConfig = {
    apiKey: process.env.GEMINI_API_KEY || "AIzaSyDBlTQXn8kH2G61w5A2cPorGMt1Ds1loo8",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    maxTokens: 100000,
    temperature: 0.7
};

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(geminiConfig.apiKey);

// Get the default model
export const model = genAI.getGenerativeModel({
    model: geminiConfig.model,
    generationConfig: {
        maxOutputTokens: geminiConfig.maxTokens,
        temperature: geminiConfig.temperature,
    }
});

// Function to get a specific model
export const getModel = (modelName) => {
    return genAI.getGenerativeModel({
        model: modelName || geminiConfig.model,
        generationConfig: {
            maxOutputTokens: geminiConfig.maxTokens,
            temperature: geminiConfig.temperature,
        }
    });
};

export const config = geminiConfig;
