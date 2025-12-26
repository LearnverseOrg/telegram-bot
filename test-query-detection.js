/**
 * Test script for Gemini Query Detection
 *
 * This script tests the query detection without running the full bot.
 * Useful for testing the Gemini API integration.
 *
 * Usage:
 *   node test-query-detection.js
 */

import {
  detectStudyMaterialQuery,
  isQueryDetectionEnabled,
} from "./src/services/gemini-service.js";
import logger from "./src/helpers/logger.js";

// Test messages
const testMessages = [
  // Should be detected as queries
  {
    message: "Machine learning for IoT decode or pyq please share",
    expectedQuery: true,
    description: "Request with subject, material types, and action verb",
  },
  {
    message: "ADBMS decode",
    expectedQuery: true,
    description: "Simple subject + material type request",
  },
  {
    message: "ADBMS pyqs",
    expectedQuery: true,
    description: "Subject + PYQ abbreviation",
  },
  {
    message: "Deld se micro",
    expectedQuery: true,
    description: "Subject with 'se' (semester) and material type",
  },
  {
    message: "Deld se it notes please 🙏",
    expectedQuery: true,
    description: "Request with emoji and polite language",
  },
  {
    message: "DELD SE IT",
    expectedQuery: true,
    description: "Subject with semester abbreviation",
  },
  {
    message: "Can anyone send DevOps endsem qp?",
    expectedQuery: true,
    description: "Question format with action verb",
  },
  {
    message: "Oop decode",
    expectedQuery: true,
    description: "Subject abbreviation + material type",
  },

  // Should NOT be detected as queries
  {
    message: "IT OPP micro available",
    expectedQuery: false,
    description: "Statement of availability, not a request",
  },
  {
    message: "Hello everyone",
    expectedQuery: false,
    description: "General greeting",
  },
  {
    message: "Thanks!",
    expectedQuery: false,
    description: "Acknowledgment",
  },
  {
    message: "Good morning",
    expectedQuery: false,
    description: "Greeting",
  },
];

async function runTests() {
  console.log("🧪 Testing Gemini Query Detection\n");
  console.log("=".repeat(80));

  // Check if Gemini is enabled
  if (!isQueryDetectionEnabled()) {
    console.error("❌ Gemini API is not configured!");
    console.error("Please set GEMINI_API_KEY in your .env file");
    console.error(
      "Get your API key from: https://makersuite.google.com/app/apikey"
    );
    process.exit(1);
  }

  console.log("✅ Gemini API is configured\n");

  let passed = 0;
  let failed = 0;
  let total = testMessages.length;

  for (let i = 0; i < testMessages.length; i++) {
    const test = testMessages[i];
    console.log(`\nTest ${i + 1}/${total}`);
    console.log("-".repeat(80));
    console.log(`Message: "${test.message}"`);
    console.log(`Description: ${test.description}`);
    console.log(`Expected: ${test.expectedQuery ? "QUERY" : "NOT QUERY"}`);

    try {
      const result = await detectStudyMaterialQuery(test.message);

      console.log(`\nResult:`);
      console.log(`  isQuery: ${result.isQuery}`);
      console.log(`  confidence: ${result.confidence}%`);
      console.log(`  reasoning: ${result.reasoning}`);

      // Check if result matches expectation
      const matches = result.isQuery === test.expectedQuery;

      if (matches) {
        console.log(`\n✅ PASSED`);
        passed++;
      } else {
        console.log(
          `\n❌ FAILED - Expected ${
            test.expectedQuery ? "query" : "not query"
          }, got ${result.isQuery ? "query" : "not query"}`
        );
        failed++;
      }

      // Add a small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`\n❌ ERROR: ${error.message}`);
      failed++;
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n📊 Test Results:");
  console.log(`  Total: ${total}`);
  console.log(`  ✅ Passed: ${passed}`);
  console.log(`  ❌ Failed: ${failed}`);
  console.log(`  Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log("\n🎉 All tests passed!");
  } else {
    console.log("\n⚠️  Some tests failed. Review the results above.");
  }
}

// Run tests
runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
