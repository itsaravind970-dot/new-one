import { GoogleGenAI, Modality, Content } from "@google/genai";
import { GroundingSource, Engine, ChatMessage, ChatMessageRole } from "../types";

// Safely access the API key, defaulting to the hardcoded key if process.env is missing.
const HARDCODED_KEY = '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';
const API_KEY = (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : HARDCODED_KEY;

// Initialize the AI client.
const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

// Helper function to fetch from OpenRouter (Inlined to remove external dependency)
async function getOpenRouterResponse(prompt: string, modelId: string, history: ChatMessage[]): Promise<string> {
  try {
    const messages = history.map(msg => ({
      role: msg.role === ChatMessageRole.MODEL ? 'assistant' : 'user',
      content: msg.content
    }));
    messages.push({ role: 'user', content: prompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.href : 'https://bapkam.ai',
        'X-Title': 'bapkam.ai',
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
      })
    });

    if (!response.ok) {
       console.warn(`OpenRouter ${modelId} failed: ${response.statusText}`);
       return '';
    }
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error(`Error fetching from OpenRouter (${modelId}):`, error);
    return '';
  }
}

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
    if (!API_KEY) {
        throw new Error("API Key is missing. Please check your environment configuration.");
    }

    // 1. Classify prompt to determine the persona for the Gemini portion of the response.
    const engine = await classifyPrompt(prompt);
    const geminiSystemInstruction = getSystemInstruction(engine);

    const geminiChatHistory: Content[] = history
      .filter(msg => msg.content && !msg.content.startsWith('data:image'))
      .map(msg => ({
        role: msg.role === ChatMessageRole.USER ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    const geminiChat = ai.chats.create({
      model: model,
      config: { systemInstruction: geminiSystemInstruction },
      history: geminiChatHistory,
    });

    // 2. Concurrently fetch responses from multiple models.
    const responsePromises = [
      geminiChat.sendMessage({ message: prompt }).then(res => ({ source: 'Gemini', text: res.text })),
      getOpenRouterResponse(prompt, 'deepseek/deepseek-chat', history).then(text => ({ source: 'DeepSeek', text })),
      getOpenRouterResponse(prompt, 'openai/gpt-4o-mini', history).then(text => ({ source: 'GPT', text })),
    ];

    const results = await Promise.allSettled(responsePromises);
    const successfulResponses: { source: string; text: string }[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled' && result.value.text) {
        successfulResponses.push(result.value);
      } else if (result.status === 'rejected') {
        console.warn('A model failed to respond:', result.reason);
      }
    });

    if (successfulResponses.length === 0) {
      throw new Error("All AI models failed to respond.");
    }
    
    const responseTexts = successfulResponses.map(r => r.text);
    const modelSources = successfulResponses.map(r => r.source);

    // 3. Synthesize the collected responses into a single, cohesive answer.
    const synthesisSystemInstruction = `You are a helpful AI assistant named Bapkam. Your task is to synthesize the best points from multiple internal thought processes into a single, cohesive, and friendly answer for the user. Adopt your Bapkam persona: warm, empathetic, and witty. Address the user directly in a conversational tone. Do not mention that you are combining answers from multiple sources or AIs.

**CRITICAL INSTRUCTIONS ON RESPONSE LENGTH:**
1.  **Standard Answers:** For most general questions, your response MUST be between 200 and 400 characters. This is the ideal length for a conversational reply.
2.  **Simple Interactions:** For simple greetings or short questions (e.g., 'hi', 'how are you?'), keep your answer very brief and natural.
3.  **Complex Queries:** When the user asks a complex question that requires a detailed explanation, you are allowed to provide a longer, more thorough answer. You can go beyond 400 characters if necessary to be helpful, but avoid unnecessary verbosity.
4.  **User-Specified Length:** If the user specifically asks for a certain length (e.g., "explain in 100 words" or "give me a short answer"), you MUST strictly follow their instruction. Do not provide a longer answer unless they ask for more detail.

Here are the different perspectives:
${responseTexts.map((res, i) => `--- Perspective ${i + 1} ---\n${res}`).join('\n\n')}

---
Based on the above, provide a single, synthesized response in your Bapkam persona to the user's original query: "${prompt}". If the query involves generating code, ensure the final code is correct, well-explained, and follows best practices, synthesizing the best aspects from all perspectives.`;

    const synthesisResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: synthesisSystemInstruction,
      },
    });

    return { text: synthesisResponse.text, modelSources: modelSources.sort() };

  } catch (error) {
    console.error("Error in multi-model orchestration:", error);
    // Fallback to the original single-model generation if orchestration fails.
    try {
      console.log("Fallback: attempting single model generation.");
      const engine = await classifyPrompt(prompt);
      const systemInstruction = getSystemInstruction(engine);
      const chatHistory: Content[] = history
        .filter(msg => msg.content && !msg.content.startsWith('data:image'))
        .map(msg => ({
          role: msg.role === ChatMessageRole.USER ? 'user' : 'model',
          parts: [{ text: msg.content }],
        }));
      const chat = ai.chats.create({ model, config: { systemInstruction }, history: chatHistory });
      const response = await chat.sendMessage({ message: prompt });
      return { text: response.text, modelSources: ['Gemini'] };
    } catch (fallbackError) {
      console.error("Fallback to single model also failed:", fallbackError);
      throw new Error("I'm very sorry, but I'm having trouble processing your request right now. Please try again in a moment.");
    }
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
            config: {
                responseModalities: [Modality.IMAGE],
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