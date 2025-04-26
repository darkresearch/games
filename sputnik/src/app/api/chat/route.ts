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
    
    // TODO: This is where we would call OpenAI's API
    // For now, we'll simulate a response
    
    // Extract the last user message
    const lastUserMessage = body.messages.filter(m => m.role === 'user').pop();
    
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: 'No user message found in the request.' },
        { status: 400 }
      );
    }
    
    // Generate a mock AI response based on the user's message
    let aiResponse: string;
    
    if (lastUserMessage.content.toLowerCase().includes('help')) {
      aiResponse = "I'm here to help you navigate your spacecraft. You can ask me about nearby planets, fuel status, or navigation advice.";
    } else if (lastUserMessage.content.toLowerCase().includes('planet')) {
      aiResponse = "There are several planets in your vicinity. The nearest ones are a water planet at coordinates X: 120, Y: -45, Z: 78 and a fire planet at X: -230, Y: 56, Z: 92.";
    } else if (lastUserMessage.content.toLowerCase().includes('fuel')) {
      aiResponse = "Your current fuel level is displayed in the top right of your screen. I recommend refueling when you reach a planet with compatible resources.";
    } else {
      aiResponse = `I've processed your message: "${lastUserMessage.content}". As your AI assistant, I'm here to help with navigation and mission objectives. What specific information do you need?`;
    }
    
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