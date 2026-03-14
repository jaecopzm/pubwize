import { NextRequest, NextResponse } from "next/server";
import { getProviderStatus, generateAI, getTaskAssignments } from "@/lib/ai-providers";

export async function GET() {
  try {
    const status = getProviderStatus();
    const assignments = getTaskAssignments();
    return NextResponse.json({ 
      success: true, 
      providers: status,
      taskAssignments: assignments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, expectJSON = false, taskType = 'quick' } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await generateAI({
      systemPrompt: "You are a helpful AI assistant.",
      userPrompt: prompt,
      expectJSON,
      temperature: 0.7,
      maxTokens: 1000,
      taskType
    });

    return NextResponse.json({
      success: true,
      response: response.content,
      provider: response.provider,
      model: response.model,
      cached: response.cached || false,
      taskType
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
