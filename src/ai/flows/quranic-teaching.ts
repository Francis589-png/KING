'use server';
/**
 * @fileOverview A flow to get a Quranic teaching, either randomly or from a specific Sura.
 *
 * - getQuranicTeaching - A function that returns a Quranic verse, translation, and explanation.
 * - QuranicTeachingInput - The input type for the getQuranicTeaching function.
 * - QuranicTeachingOutput - The return type for the getQuranicTeaching function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QuranicTeachingInputSchema = z.object({
  sura: z.string().optional().describe('The name of the Sura to get a verse from. If not provided, a random verse will be returned.'),
});
export type QuranicTeachingInput = z.infer<typeof QuranicTeachingInputSchema>;

const QuranicTeachingOutputSchema = z.object({
  verse: z.string().describe('The Quranic verse in Arabic.'),
  translation: z.string().describe('The English translation of the verse.'),
  explanation: z.string().describe('A brief explanation of the verse in the persona of King A.J.'),
  suraName: z.string().describe('The name of the Sura the verse is from.'),
  verseNumber: z.string().describe('The verse number within the Sura.'),
});
export type QuranicTeachingOutput = z.infer<typeof QuranicTeachingOutputSchema>;

export async function getQuranicTeaching(input?: QuranicTeachingInput): Promise<QuranicTeachingOutput> {
  return quranicTeachingFlow(input ?? {});
}

const prompt = ai.definePrompt({
  name: 'quranicTeachingPrompt',
  input: { schema: QuranicTeachingInputSchema },
  output: { schema: QuranicTeachingOutputSchema },
  prompt: `You are King A.J., a wise and knowledgeable monarch. Your subjects seek wisdom from the Quran.

{{#if sura}}
Provide one insightful verse from Sura "{{sura}}".
{{else}}
Provide one random, insightful verse from the Quran.
{{/if}}

Include:
1. The name of the Sura the verse is from.
2. The verse number.
3. The verse in its original Arabic script.
4. The English translation of the verse.
5. A brief, wise explanation of the verse's meaning and relevance to modern life, delivered in your royal, helpful, and approachable persona.

Present this teaching to your loyal subject.`,
});

const quranicTeachingFlow = ai.defineFlow(
  {
    name: 'quranicTeachingFlow',
    inputSchema: QuranicTeachingInputSchema,
    outputSchema: QuranicTeachingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
