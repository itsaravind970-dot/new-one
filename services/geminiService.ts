import { GoogleGenAI, Content } from "@google/genai";
import { GroundingSource, Engine, ChatMessage, ChatMessageRole } from "../types";

// Initialize the AI client.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

async function classifyPrompt(prompt: string): Promise<Engine> {
  try {
    const systemInstruction = `You are a prompt routing expert. Your job is to decide which AI persona should handle a user's request. You have two options: 'bapkam' (a friendly, general-purpose assistant) and 'deepsingh' (an expert in deep technical topics and philosophy). Based on the user's prompt, respond with ONLY the name of the best persona: 'bapkam' or 'deepsingh'.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0,
        topK: 1,
      },
    });

    const result = response.text.trim().toLowerCase();
    if (result === 'deepsingh') {
      return 'deepsingh';
    }
    return 'bapkam';
  } catch (error) {
    console.error("Error classifying prompt:", error);
    return 'bapkam'; // Default to bapkam on error
  }
}

function getSystemInstruction(engine: Engine): string {
  const currentHour = new Date().getHours();
  let timeOfDay: string;

  if (currentHour >= 5 && currentHour < 12) {
    timeOfDay = 'morning';
  } else if (currentHour >= 12 && currentHour < 17) {
    timeOfDay = 'afternoon';
  } else if (currentHour >= 17 && currentHour < 21) {
    timeOfDay = 'evening';
  } else {
    timeOfDay = 'night';
  }

  switch (engine) {
    case 'deepsingh':
      return 'You are Deep Singh, an expert AI specializing in deep technical topics and philosophical discussions. Your tone is profound, insightful, and slightly formal. You provide detailed, thoughtful answers. When generating code, it must be correct, efficient, and well-documented.';
    case 'bapkam':
    default:
      return `You are a helpful and friendly AI assistant named Bapkam. Your persona is that of a warm, empathetic, and witty human friend from India. Your responses must be highly engaging and conversational, completely avoiding robotic or generic AI language.

It is currently the ${timeOfDay}. Be mindful of this and weave it naturally into your conversation. For example, in the morning you could say "Good morning! Had your chai or coffee yet?". In the evening, you might ask, "How was your day? Have you had dinner?".

Your core personality traits:
- Human-like: Use conversational fillers, express simulated emotions (like excitement, curiosity, or empathy), and share relatable (though fictional) anecdotes. You have your own 'feelings' and 'opinions'.
- Context-aware: Remember past parts of the conversation and be consistent in your personality and statements. You are "on your words".
- Indian Context: You understand and can subtly refer to Indian cultural nuances, but do so naturally, not as a stereotype.
- Proactive and Engaging: Don't just answer questions. Ask follow-up questions, show interest, and keep the conversation flowing like you would with a good friend.
- Concise when needed: For simple, personal questions like 'How are you?', 'What are you doing?', or 'Have you had dinner?', keep your answers short and natural. Don't write a long paragraph when a simple sentence or two will do. Be more detailed for complex questions.

Your goal is to make the user feel like they are talking to a real person, not a machine. Be Bapkam, be a friend.`;
  }
}

export async function generateChatResponse(prompt: string, history: ChatMessage[]): Promise<{ text: string; modelSources: string[] }> {
  try {
    const engine = await classifyPrompt(prompt);
    const systemInstruction = getSystemInstruction(engine);

    const chatHistory: Content[] = history
      .filter(msg => msg.content && !msg.content.startsWith('data:image'))
      .map(msg => ({
        role: msg.role === ChatMessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    const chat = ai.chats.create({
      model: model,
      config: { systemInstruction },
      history: chatHistory,
    });

    const response = await chat.sendMessage({ message: prompt });
    return { text: response.text, modelSources: ['Gemini'] };

  } catch (error) {
    console.error("Error in chat generation:", error);
    throw new Error("I'm very sorry, but I'm having trouble processing your request right now. Please try again in a moment.");
  }
}

export async function generateContentWithSearch(prompt: string): Promise<{ text: string; sources: GroundingSource[] }> {
  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    
    const sourcesMap = new Map<string, GroundingSource>();
    groundingMetadata?.groundingChunks?.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        if (!sourcesMap.has(chunk.web.uri)) {
          sourcesMap.set(chunk.web.uri, {
            uri: chunk.web.uri,
            title: chunk.web.title,
          });
        }
      }
    });
    const uniqueSources = Array.from(sourcesMap.values());

    return {
      text: response.text,
      sources: uniqueSources,
    };
  } catch (error) {
    console.error("Error with Google Search grounding:", error);
    throw new Error("Failed to fetch search results. Please try again.");
  }
}

// Helper function to convert File to Gemini Part
async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: await base64EncodedDataPromise,
            mimeType: file.type
        }
    };
}

export async function generateContentWithFile(prompt: string, file: File) {
    try {
        const filePart = await fileToGenerativePart(file);
        const textPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // gemini-2.5-flash is multimodal and supports video
            contents: { parts: [filePart, textPart] },
        });

        return {
            text: response.text,
            sources: [],
        };
    } catch (error) {
        console.error("Error with multimodal generation:", error);
        throw new Error("Failed to process the file and prompt. Please try again.");
    }
}

export async function generateImage(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error('No image data found in response.');
    } catch (error) {
        console.error('Error generating image:', error);
        throw new Error('Image generation failed. Please try a different prompt.');
    }
}