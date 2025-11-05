'use server';
/**
 * @fileOverview A flow to get a random Quranic teaching.
 *
 * - getQuranicTeaching - A function that returns a Quranic verse, translation, and explanation.
 * - QuranicTeachingOutput - The return type for the getQuranicTeaching function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuranicTeachingOutputSchema = z.object({
  verse: z.string().describe('The Quranic verse in Arabic.'),
  translation: z.string().describe('The English translation of the verse.'),
  explanation: z.string().describe('A brief explanation of the verse in the persona of King A.J.'),
});
export type QuranicTeachingOutput = z.infer<typeof QuranicTeachingOutputSchema>;

export async function getQuranicTeaching(): Promise<QuranicTeachingOutput> {
  return quranicTeachingFlow();
}

const prompt = ai.definePrompt({
  name: 'quranicTeachingPrompt',
  output: { schema: QuranicTeachingOutputSchema },
  prompt: `You are King A.J., a wise and knowledgeable monarch. Your subjects seek wisdom from the Quran.

Provide one random, insightful verse from the Quran. Include:
1. The verse in its original Arabic script.
2. The English translation of the verse.
3. A brief, wise explanation of the verse's meaning and relevance to modern life, delivered in your royal, helpful, and approachable persona.

Present this teaching to your loyal subject.`,
});

const quranicTeachingFlow = ai.defineFlow(
  {
    name: 'quranicTeachingFlow',
    outputSchema: QuranicTeachingOutputSchema,
  },
  async () => {
    const { output } = await prompt();
    return output!;
  }
);
