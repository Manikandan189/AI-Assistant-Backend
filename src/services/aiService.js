import { model, getModel } from '../config/gemini.js';

/**
 * AI Service for interacting with Gemini API
 */
export const aiService = {
    /**
     * Analyze a single file
     * @param {string} fileContent - Content of the file
     * @param {string} fileName - Name of the file
     * @param {string|null} modelName - Optional model name
     * @returns {Promise<string>} Analysis result
     */
    analyzeFile: async (fileContent, fileName, modelName = null) => {
        try {
            const selectedModel = modelName ? getModel(modelName) : model;

            const prompt = `Analyze the following file named "${fileName}". 
            Provide a comprehensive summary, key points, and identify any potential issues or improvements.
            - Give the response in straight forward in one line, but if user ask details like that keyword then explain it in detail
            
            File Content:
            ${fileContent.substring(0, 90000)} // Limit content to avoid token limits
            `;

            const result = await selectedModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error analyzing file with Gemini:", error);
            throw new Error("Failed to analyze file");
        }
    },

    /**
     * Analyze multiple files (Project Analysis)
     * @param {Array} files - Array of file objects
     * @param {string|null} modelName - Optional model name
     * @returns {Promise<string>} Project analysis
     */
    analyzeProject: async (files, modelName = null) => {
        try {
            const selectedModel = modelName ? getModel(modelName) : model;

            let prompt = "Analyze the following project files and provide a high-level summary of the project, its architecture, and functionality ,Give the response in straight forward in one line, but if user ask details like that keyword then explain it in detail";

            for (const file of files) {
                // Skip non-text files or very large files for now
                if (file.type && file.type.startsWith('image')) continue;
                // if (file.size > 1000000) continue;

                prompt += `--- File: ${file.name} ---\n`;
                prompt += `${file.content ? file.content.substring(0, 20000) : 'Content not available'}\n\n`;
            }

            console.log('Sending request to Gemini API...');
            const result = await selectedModel.generateContent(prompt);
            const response = await result.response;
            console.log('Gemini API response received');
            return response.text();
        } catch (error) {
            console.error("Error analyzing project with Gemini:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack,
                name: error.name,
                response: error.response
            });
            // Throw the actual error message instead of generic one
            throw new Error(error.message || "Failed to analyze project");
        }
    },

    /**
     * Query with file context (conversational AI)
     * @param {string} userQuery - User's question
     * @param {Array} files - Array of file objects
     * @param {string} projectName - Name of the project
     * @param {string|null} modelName - Optional model name
     * @returns {Promise<string>} AI response
     */
    queryWithContext: async (userQuery, files, projectName, modelName = null) => {
        try {
            const selectedModel = modelName ? getModel(modelName) : model;

            // Build system prompt
            const systemPrompt = `You are an expert AI coding assistant analyzing the project "${projectName}".

IMPORTANT FORMATTING RULES:
- Use proper markdown formatting in your responses
- Wrap code snippets in triple backticks with language identifier
- Use **bold** for important terms and concepts
- Use bullet points (-) for lists
- Use numbered lists (1., 2., 3.) for sequential steps
- Use headers (##, ###) to organize longer responses
- Reference specific files and line numbers when relevant
- Keep explanations clear and concise
- Give the response in straight forward in one line, but if user ask details like that keyword then explain it in detail

USER QUESTION: "${userQuery}"

PROJECT FILES CONTEXT:
`;

            let prompt = systemPrompt;
            let fileCount = 0;

            // Add file contents to prompt
            for (const file of files) {
                // Skip non-text files or very large files
                if (file.type && file.type.startsWith('image')) continue;
                if (file.size > 500000) continue; // Skip files larger than 500KB

                prompt += `\n--- File: ${file.name} (${file.path}) ---\n`;
                if (file.content) {
                    // Limit content to avoid token limits
                    const content = file.content.substring(0, 15000);
                    prompt += `\`\`\`\n${content}\n\`\`\`\n`;
                    fileCount++;
                } else {
                    prompt += `[Content not available]\n`;
                }
            }

            prompt += `\n\nINSTRUCTIONS:
Based on the ${fileCount} files provided above, answer the user's question with:
1. Clear, well-formatted markdown
2. Code examples in proper code blocks with syntax highlighting
3. Specific references to files and code when relevant
4. Organized structure with headers and lists
5. Concise but comprehensive explanations

Your response:`;

            const result = await selectedModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error querying with context:", error);
            throw new Error("Failed to process query");
        }
    }
};
