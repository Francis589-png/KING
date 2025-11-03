'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Role } from '@/lib/types';
import { googleAI } from '@genkit-ai/google-genai';

// The schema for messages used inside the flow.
// Does not need id or createdAt.
const FlowMessageSchema = z.object({
  role: z.nativeEnum(Role),
  content: z.string(),
});

const DetectedObjectSchema = z.object({
  name: z.string(),
  description: z.string(),
  confidence: z.number(),
});

const ChatInputSchema = z.object({
  messages: z.array(FlowMessageSchema),
  persona: z.string(),
  detections: z.array(DetectedObjectSchema).optional(),
});

const ChatOutputSchema = z.object({
  message: FlowMessageSchema,
});

function toGenkitMessages(messages: z.infer<typeof FlowMessageSchema>[]) {
  // The last message is the new user prompt, don't include it in history.
  const history = messages.slice(0, -1);
  return history.map(msg => {
    if (msg.role === Role.user) {
      return { role: 'user' as const, content: [{ text: msg.content }] };
    }
    return { role: 'model' as const, content: [{ text: msg.content }] };
  });
}

export const chat = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ messages, persona, detections }) => {
    const history = toGenkitMessages(messages);
    const lastMessage = messages[messages.length - 1];

    let systemPrompt = persona;
    if (detections && detections.length > 0) {
      const detectionText = detections.map(d => `${d.name} (${d.description})`).join(', ');
      systemPrompt += `\n\nCONTEXT: The user has recently used an object detector and found the following items: ${detectionText}. If the user asks about these items, use this context to answer their questions.`;
    }

    const llmResponse = await ai.generate({
      system: systemPrompt,
      prompt: lastMessage.content,
      history,
      model: googleAI.model('gemini-2.5-flash'),
    });

    return {
      message: {
        role: Role.assistant,
        content: llmResponse.text,
      },
    };
  }
);
