import { NextResponse } from 'next/server';

// Chat message types
export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
};

export type ChatResponse = {
  message: ChatMessage;
};

export async function POST(req: Request) {
  try {
    const body = await req.json() as ChatRequest;
    
    // Validate the request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request format. Messages array is required.' },
        { status: 400 }
      );
    }
    
    // Extract the last user message
    const lastUserMessage = body.messages.filter(m => m.role === 'user').pop();
    
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found in the request.' },
        { status: 400 }
      );
    }
    
    // In a real implementation, we would get the sputnik number from the context
    // For now, we'll use a placeholder that will be filled by the frontend
    const sputnikNumber = "[NUMBER]";

    let aiResponse = `Welcome to DARK Universe. Your AI is spaceship number #[NUMBER] in this realm. Comms are not fully up yet, but your ship's starting position has been solidified. Standby.`;
    
    // Return the AI response
    return NextResponse.json({
      message: {
        role: 'assistant',
        content: aiResponse
      }
    });
    
  } catch (error) {
    console.error('Error processing chat request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 