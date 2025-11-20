import { ChatMessage, ChatMessageRole } from "../types";

const OPENROUTER_API_KEY = "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";
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Map app's role to OpenAI's role ('assistant')
function mapRole(role: ChatMessageRole): 'user' | 'assistant' {
    return role === ChatMessageRole.USER ? 'user' : 'assistant';
}

export async function getOpenRouterResponse(
    prompt: string,
    model: string,
    history: ChatMessage[]
): Promise<string> {
    try {
        const messages = history
            .filter(msg => msg.content && !msg.content.startsWith('data:image'))
            .map(msg => ({
                role: mapRole(msg.role),
                content: msg.content,
            }));
        
        messages.push({ role: 'user', content: prompt });

        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                // Recommended headers by OpenRouter to identify your app
                'HTTP-Referer': 'https://bapkam.ai', 
                'X-Title': 'bapkam.ai',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error(`Error from OpenRouter model ${model}:`, errorData);
            throw new Error(`API call to ${model} failed with status ${response.status}.`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error) {
        console.error(`Failed to get response from OpenRouter model ${model}:`, error);
        // Re-throw the error to be caught by Promise.allSettled
        throw error;
    }
}