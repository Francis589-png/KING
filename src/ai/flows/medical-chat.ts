'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { Role } from '@/lib/types';
import { googleAI } from '@genkit-ai/google-genai';
import { getMedicalTeaching } from './medical-teaching';

const FlowMessageSchema = z.object({
  role: z.nativeEnum(Role),
  content: z.string(),
});

const MedicalChatInputSchema = z.object({
  messages: z.array(FlowMessageSchema),
});

const MedicalChatOutputSchema = z.object({
  message: FlowMessageSchema,
});

function toGenkitMessages(messages: z.infer<typeof FlowMessageSchema>[]) {
  return messages.map(msg => {
    if (msg.role === Role.user) {
      return { role: 'user' as const, content: [{ text: msg.content }] };
    }
    return { role: 'model' as const, content: [{ text: msg.content }] };
  });
}

const getMedicalTeachingTool = ai.defineTool(
    {
        name: 'getMedicalTeaching',
        description: 'Get information about a specific medical ailment, including symptoms, natural remedies, and modern advice. Use this tool if the user asks a direct question about a condition.',
        inputSchema: z.object({ topic: z.string() }),
        outputSchema: z.object({
            ailment: z.string(),
            symptoms: z.array(z.string()),
            naturalRemedy: z.object({ name: z.string(), description: z.string() }),
            medicalAdvice: z.string(),
            disclaimer: z.string(),
        }),
    },
    async ({ topic }) => {
        return getMedicalTeaching({ topic });
    }
);


export const medicalChat = ai.defineFlow(
  {
    name: 'medicalChatFlow',
    inputSchema: MedicalChatInputSchema,
    outputSchema: MedicalChatOutputSchema,
  },
  async ({ messages }) => {
    const history = toGenkitMessages(messages.slice(0, -1));
    const lastMessage = messages[messages.length - 1];
    
    const persona = `You are the Royal Physician of King A.J.'s court, a wise, experienced, and trusted medical advisor. Your knowledge spans both ancient herbal remedies and modern medicine. Engage in a natural, conversational dialogue. Ask clarifying questions if needed. If the user asks about a specific ailment, use the available tool to provide a structured response. Always prioritize safety and end every single response with the disclaimer: "The counsel of the Royal Physician is for informational purposes only. Please consult a qualified healthcare professional for any health concerns."`;

    const llmResponse = await ai.generate({
      system: persona,
      prompt: lastMessage.content,
      history,
      model: googleAI.model('gemini-2.5-flash'),
      tools: [getMedicalTeachingTool],
    });

    const output = llmResponse.text;

    return {
      message: {
        role: Role.assistant,
        content: output,
      },
    };
  }
);
