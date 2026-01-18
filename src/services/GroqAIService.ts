
import Groq from 'groq-sdk';

export class GroqAIService {
    private client: Groq;
    private visionModel = 'meta-llama/llama-4-scout-17b-16e-instruct';
    private textModel = 'llama-3.1-8b-instant';

    constructor() {
        this.client = new Groq({
            apiKey: process.env.GROQ_API_KEY,
        });
    }

    async processRequest(input: string, image?: string, systemPrompt?: string) {
        let model = this.textModel;
        let messages: any[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }

        if (image) {
            model = this.visionModel;
            console.log("Using Vision Model:", model);
            messages.push({
                role: 'user',
                content: [
                    { type: 'text', text: input || "Analyze this image and extract data." },
                    { type: 'image_url', image_url: { url: image } }
                ]
            });
        } else {
            messages.push({ role: 'user', content: input });
        }

        try {
            const completion = await this.client.chat.completions.create({
                messages: messages,
                model: model,
                temperature: 0,
                max_tokens: 6000,
                response_format: { type: "json_object" }
            });

            return completion.choices[0]?.message?.content || '{}';
        } catch (error) {
            console.error('Groq Service Error:', error);
            throw error;
        }
    }
}
