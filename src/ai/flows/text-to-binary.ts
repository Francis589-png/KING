'use server';

/**
 * @fileOverview A flow to translate human language to machine language (binary).
 *
 * - textToBinary - A function that translates text to binary.
 * - TextToBinaryInput - The input type for the textToBinary function.
 * - TextToBinaryOutput - The return type for the textToBinary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const TextToBinaryInputSchema = z.object({
  text: z.string().describe('The human language text to translate.'),
});
export type TextToBinaryInput = z.infer<typeof TextToBinaryInputSchema>;

const TextToBinaryOutputSchema = z.object({
  binary: z.string().describe('The machine language (binary) translation.'),
});
export type TextToBinaryOutput = z.infer<typeof TextToBinaryOutputSchema>;

export async function textToBinary(input: TextToBinaryInput): Promise<TextToBinaryOutput> {
  return textToBinaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'textToBinaryPrompt',
  input: { schema: TextToBinaryInputSchema },
  output: { schema: TextToBinaryOutputSchema },
  prompt: `You are a machine language expert. Convert the following text into its binary representation. Each character should be converted to its 8-bit ASCII binary equivalent, and all binary codes should be concatenated into a single string with spaces between each 8-bit group.

Text: {{{text}}}`,
});

const textToBinaryFlow = ai.defineFlow(
  {
    name: 'textToBinaryFlow',
    inputSchema: TextToBinaryInputSchema,
    outputSchema: TextToBinaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
