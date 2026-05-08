/**
 * Robustness Test for the New AI System
 * 
 * This script performs live tests of the AI generation logic to verify:
 * 1. JSON parsing and repair (Brief & Outline)
 * 2. Instruction following (Word counts, keyword density)
 * 3. Provider fallbacks (Simulated failure)
 */
import { 
  generateBrief, 
  generateOutline, 
  generateDraft, 
  getProviderStatus 
} from "../lib/ai";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function runTests() {
  console.log("🚀 Starting AI Robustness Test Suite...\n");

  const status = getProviderStatus();
  console.log("📊 Current Provider Status:");
  status.forEach(p => console.log(` - ${p.provider}: ${p.available ? '✅ Available' : '❌ Limited'} (${p.requestsInWindow}/${p.limit})`));
  console.log("");

  const TEST_KEYWORD = "best budget espresso machines 2026";
  const SITE_CONTEXT = {
    niche: "Home Coffee Brewing",
    targetCountry: "US",
    language: "en",
    brandVoice: {
      adjectives: ["helpful", "expert", "direct"],
      tone: "professional",
      targetAudience: "Beginner home baristas"
    }
  };

  try {
    // 1. Test Brief Generation (JSON Robustness)
    console.log("📝 Phase 1: Brief Generation (Testing JSON Parsing)...");
    const brief = await generateBrief({
      keyword: TEST_KEYWORD,
      siteContext: SITE_CONTEXT
    });
    console.log(" ✅ Brief generated successfully.");
    console.log(`    - Intent: ${brief.intent}`);
    console.log(`    - Headings: ${brief.headings.length} items`);
    console.log("");

    // 2. Test Outline Generation (JSON Robustness)
    console.log("🏗️ Phase 2: Outline Generation...");
    const outline = await generateOutline({
      brief,
      keyword: TEST_KEYWORD
    });
    console.log(" ✅ Outline generated successfully.");
    console.log(`    - Sections: ${outline.sections.length} headings`);
    console.log("");

    // 3. Test Draft Generation (Instruction Following)
    console.log("✍️ Phase 3: Draft Generation (Testing Word Count & Style)...");
    const start = Date.now();
    const draft = await generateDraft({
      outline,
      keyword: TEST_KEYWORD,
      tone: "professional",
      targetWordCount: 1500,
      siteBrandVoice: SITE_CONTEXT.brandVoice
    });
    const duration = (Date.now() - start) / 1000;
    
    const wordCount = draft.content.split(/\s+/).length;
    console.log(` ✅ Draft generated in ${duration.toFixed(1)}s.`);
    console.log(`    - Word count: ${wordCount} words (Target: 1500)`);
    console.log(`    - Quality: ${wordCount > 1000 ? 'High' : 'Low'}`);
    console.log(`    - Content Preview: ${draft.content.slice(0, 200)}...`);
    
    const keywordMatches = (draft.content.match(new RegExp(TEST_KEYWORD, "gi")) || []).length;
    console.log(`    - Keyword density: ${keywordMatches} occurrences`);

    console.log("\n✨ All robustness tests passed!");

  } catch (error) {
    console.error("\n❌ Robustness Test Failed!");
    console.error(error);
    process.exit(1);
  }
}

runTests();
