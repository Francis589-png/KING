'use server';
/**
 * @fileOverview A flow to get the full text of a Quranic Sura.
 *
 * - getFullSura - A function that returns the full text of a Sura, including all verses with translations.
 * - GetFullSuraInput - The input type for the getFullSura function.
 * - GetFullSuraOutput - The return type for the getFullSura function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GetFullSuraInputSchema = z.object({
  suraName: z.string().describe('The name of the Sura to retrieve.'),
});
export type GetFullSuraInput = z.infer<typeof GetFullSuraInputSchema>;

const VerseSchema = z.object({
    verseNumber: z.number().describe('The verse number.'),
    arabicText: z.string().describe('The Arabic text of the verse.'),
    englishTranslation: z.string().describe('The English translation of the verse.'),
});

const GetFullSuraOutputSchema = z.object({
  suraName: z.string().describe('The name of the Sura.'),
  introduction: z.string().describe('A scholarly introduction to the Sura, including its themes, context of revelation, and significance.'),
  verses: z.array(VerseSchema).describe('An array containing all the verses of the Sura.'),
});
export type GetFullSuraOutput = z.infer<typeof GetFullSuraOutputSchema>;


export async function getFullSura(input: GetFullSuraInput): Promise<GetFullSuraOutput> {
  return getFullSuraFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getFullSuraPrompt',
  input: { schema: GetFullSuraInputSchema },
  output: { schema: GetFullSuraOutputSchema },
  prompt: `You are a distinguished Islamic scholar. Your task is to provide the complete text of a specific Sura from the Holy Quran.

For the Sura "{{suraName}}", you must provide the following:
1.  The name of the Sura.
2.  A scholarly introduction to the Sura. This should cover its themes, the context of its revelation (Makki or Madani), and its overall significance.
3.  An array containing every single verse of the Sura. Each item in the array must be an object with:
    - 'verseNumber': The number of the verse.
    - 'arabicText': The full, original Arabic text of the verse.
    - 'englishTranslation': An accurate English translation of the verse.

Return the entire Sura, from the first verse to the last, in the specified JSON format.
`,
});

const getFullSuraFlow = ai.defineFlow(
  {
    name: 'getFullSuraFlow',
    inputSchema: GetFullSuraInputSchema,
    outputSchema: GetFullSuraOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
