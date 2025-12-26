import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_API_KEY } from "../config/config.js";
import logger from "../helpers/logger.js";

// Initialize Gemini AI
let genAI = null;
let model = null;

try {
  if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    logger.info("Gemini AI initialized successfully");
  } else {
    logger.warn("GEMINI_API_KEY not found. Query detection will be disabled.");
  }
} catch (error) {
  logger.error({ error: error.message }, "Failed to initialize Gemini AI");
}

/**
 * Analyzes a message to determine if it's a study material query
 * @param {string} message - The message to analyze
 * @returns {Promise<{isQuery: boolean, confidence: number, reasoning: string}>}
 */
export async function detectStudyMaterialQuery(message) {
  // If Gemini is not initialized, return false
  if (!model) {
    logger.warn("Gemini model not initialized. Skipping query detection.");
    return {
      isQuery: false,
      confidence: 0,
      reasoning: "Gemini not configured",
    };
  }

  try {
    const prompt = `You are an AI assistant that detects if a message is requesting study materials.

Study material requests typically include:
- Asking for specific materials: "decode", "micro", "pyq" (previous year questions), "endsem", "insem", "notes", "units", "qp" (question papers), "syllabus", "books"
- Subject names or codes: "ADBMS", "DELD", "OOP", "DevOps", "Machine learning", "IoT"
- Requesting actions: "please share", "send", "can anyone send", "need", "want", "looking for"

NOT study material requests:
- Statements of availability: "IT OPP micro available", "I have notes", "materials are here"
- General chat: "hello", "thanks", "ok"
- Questions about availability without requesting: "is it available?"

Analyze this message and determine if it's a study material REQUEST (not just mentioning materials):

Message: "${message}"

Respond in JSON format:
{
  "isQuery": true/false,
  "confidence": 0-100,
  "reasoning": "brief explanation"
}

Only respond with valid JSON, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    logger.debug(
      { message, geminiResponse: text },
      "Gemini query detection response"
    );

    // Parse the JSON response
    try {
      // Extract JSON from markdown code blocks if present
      let jsonText = text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/g, "");
      }

      const parsed = JSON.parse(jsonText);

      return {
        isQuery: parsed.isQuery || false,
        confidence: parsed.confidence || 0,
        reasoning: parsed.reasoning || "No reasoning provided",
      };
    } catch (parseError) {
      logger.error(
        { error: parseError.message, text },
        "Failed to parse Gemini response"
      );
      return { isQuery: false, confidence: 0, reasoning: "Parse error" };
    }
  } catch (error) {
    logger.error({ error: error.message }, "Error in Gemini query detection");
    return { isQuery: false, confidence: 0, reasoning: "Error occurred" };
  }
}

/**
 * Checks if query detection is enabled
 * @returns {boolean}
 */
export function isQueryDetectionEnabled() {
  return model !== null;
}
