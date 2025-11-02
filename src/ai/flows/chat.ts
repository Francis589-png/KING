'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message as MessageSchema, Role } from '@/lib/types';

const ChatInputSchema = z.object({
  messages: z.array(MessageSchema),
  persona: z.string(),
});

const ChatOutputSchema = z.object({
  message: MessageSchema,
});

function toGenkitMessages(messages: z.infer<typeof MessageSchema>[]) {
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
  async ({ messages, persona }) => {
    const history = toGenkitMessages(messages);
    const lastMessage = messages[messages.length - 1];

    const llmResponse = await ai.generate({
      system: persona,
      prompt: lastMessage.content,
      history,
      model: 'googleai/gemini-2.5-flash',
    });

    return {
      message: {
        id: new Date().toISOString() + '-ai',
        role: Role.assistant,
        content: llmResponse.text,
      },
    };
  }
);
