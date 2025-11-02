'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Message as MessageSchema, Role } from '@/lib/types';
import { AIMessage, HumanMessage } from 'genkit';

const ChatInputSchema = z.object({
  messages: z.array(MessageSchema),
  persona: z.string(),
});

const ChatOutputSchema = z.object({
  message: MessageSchema,
});

function toGenkitMessages(messages: z.infer<typeof MessageSchema>[]) {
  return messages.map(msg => {
    if (msg.role === Role.user) {
      return { role: 'user', content: [{ text: msg.content }] };
    }
    return { role: 'model', content: [{ text: msg.content }] };
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

    const llmResponse = await ai.generate({
      prompt: `${persona}\n\nContinue the conversation. Respond as the persona described.`,
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
