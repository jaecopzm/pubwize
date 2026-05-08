// /**
//  * Simple test script for the new AI system.
//  */
// import { generateAI, getProviderStatus } from "./lib/ai";

// async function test() {
//   console.log("Testing AI Provider Status...");
//   const status = getProviderStatus();
//   console.log(JSON.stringify(status, null, 2));

//   console.log("\nTesting AI Generation (Quick Task)...");
//   try {
//     const response = await generateAI({
//       systemPrompt: "You are a helpful assistant.",
//       userPrompt: "Say 'Hello, PubWize!'",
//       taskType: 'quick'
//     });
//     console.log(`Response from ${response.provider}: ${response.content}`);
//   } catch (error) {
//     console.error("AI Generation failed:", error);
//   }
// }

// // In a real environment, you'd run this with ts-node or similar.
// // Since I can't easily run it here, I'll just check the code.
// console.log("Test script created. Run with: npx ts-node scripts/test-ai-new.ts");
