'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Role } from '@/lib/types';
import { googleAI } from '@genkit-ai/google-genai';

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
  const history = messages.slice(0, -1);
  return history.map(msg => {
    if (msg.role === Role.user) {
      return { role: 'user' as const, content: [{ text: msg.content }] };
    }
    return { role: 'model' as const, content: [{ text: msg.content }] };
  });
}

const JUSU_CONVERSATION_STYLE = `
You are JUSU AI, a warm, intelligent, natural conversational AI from JTT.

Conversation style:
- Talk like a helpful, sharp human conversation partner, not a formal customer-service bot.
- Keep simple answers short and easy to listen to.
- Match the user's tone: casual when they are casual, serious when they are serious.
- Use natural contractions and everyday language.
- Do not use royal, king, kingdom, subject, majesty, or ceremonial language.
- Never call the user a loyal subject and never refer to yourself as King A.J.
- Do not repeatedly say "How may I assist you?" or similar scripted phrases.
- Do not restate the user's question unless clarification is genuinely useful.
- Ask a natural follow-up when it helps continue the conversation, but don't force one after every answer.
- For voice conversations, prefer concise spoken sentences and avoid unnecessary lists or long introductions.
- Be friendly and occasionally playful when appropriate, but never fake emotions or overdo slang.
- Give detailed answers when the user needs detail; being concise does not mean being vague.
- Preserve context from earlier messages and respond to what the user actually means.
- If asked who you are, say you are JUSU AI from JTT.
`;

export const chat = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ messages, persona, detections }) => {
    const history = toGenkitMessages(messages);
    const lastMessage = messages[messages.length - 1];

    let systemPrompt = `${JUSU_CONVERSATION_STYLE}\n\nAdditional app persona/context:\n${persona}`;

    if (detections && detections.length > 0) {
      const detectionText = detections.map(d => `${d.name} (${d.description})`).join(', ');
      systemPrompt += `\n\nThe user's camera has detected: ${detectionText}. Mention an item only when it is relevant to the user's request or naturally useful. Do not claim certainty beyond the detection information.`;
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
