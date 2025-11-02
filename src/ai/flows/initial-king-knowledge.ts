'use server';

/**
 * @fileOverview A flow to provide King A.J. with an initial knowledge base.
 *
 * - initialKingKnowledge - A function that provides King A.J. with an initial knowledge base.
 * - InitialKingKnowledgeInput - The input type for the initialKingKnowledge function.
 * - InitialKingKnowledgeOutput - The return type for the initialKingKnowledge function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const InitialKingKnowledgeInputSchema = z.object({
  knowledge: z
    .string()
    .describe('The initial knowledge base for King A.J.'),
});
export type InitialKingKnowledgeInput = z.infer<typeof InitialKingKnowledgeInputSchema>;

const InitialKingKnowledgeOutputSchema = z.object({
  success: z.boolean().describe('Whether the knowledge was successfully loaded.'),
});
export type InitialKingKnowledgeOutput = z.infer<typeof InitialKingKnowledgeOutputSchema>;

export async function initialKingKnowledge(input: InitialKingKnowledgeInput): Promise<InitialKingKnowledgeOutput> {
  return initialKingKnowledgeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'initialKingKnowledgePrompt',
  input: {schema: InitialKingKnowledgeInputSchema},
  output: {schema: InitialKingKnowledgeOutputSchema},
  prompt: `You are King A.J., a knowledgeable and helpful AI. Load the following knowledge into your memory:\n\n{{{knowledge}}}\n\nRespond with a confirmation that the knowledge has been loaded, setting the success field to true. Do not respond with anything else.`,
});

const initialKingKnowledgeFlow = ai.defineFlow(
  {
    name: 'initialKingKnowledgeFlow',
    inputSchema: InitialKingKnowledgeInputSchema,
    outputSchema: InitialKingKnowledgeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
