'use server';

/**
 * @fileOverview Refines the King A.J. persona based on user interactions.
 *
 * This file exports:
 * - `refineKingPersona`: The function to refine the King A.J. persona.
 * - `RefineKingPersonaInput`: The input type for the refineKingPersona function.
 * - `RefineKingPersonaOutput`: The output type for the refineKingPersona function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RefineKingPersonaInputSchema = z.object({
  initialPersona: z
    .string()
    .describe('The initial persona description of King A.J.'),
  userFeedback: z
    .string()
    .describe('Feedback from users about King A.J.s responses.'),
  exampleConversation: z
    .string()
    .describe('An example conversation between a user and King A.J.'),
});

export type RefineKingPersonaInput = z.infer<typeof RefineKingPersonaInputSchema>;

const RefineKingPersonaOutputSchema = z.object({
  refinedPersona: z
    .string()
    .describe('The refined persona description of King A.J.'),
});

export type RefineKingPersonaOutput = z.infer<typeof RefineKingPersonaOutputSchema>;

export async function refineKingPersona(
  input: RefineKingPersonaInput
): Promise<RefineKingPersonaOutput> {
  return refineKingPersonaFlow(input);
}

const refineKingPersonaPrompt = ai.definePrompt({
  name: 'refineKingPersonaPrompt',
  input: {schema: RefineKingPersonaInputSchema},
  output: {schema: RefineKingPersonaOutputSchema},
  prompt: `You are an AI persona refinement expert. You are tasked with refining the persona of King A.J. based on user feedback and example conversations.

  Initial Persona: {{{initialPersona}}}

  User Feedback: {{{userFeedback}}}

  Example Conversation: {{{exampleConversation}}}

  Based on the user feedback and the example conversation, refine the persona of King A.J. to better align with user expectations and preferences. Consider adjusting his tone, communication style, and knowledge base. The refined persona should still maintain his core identity as a knowledgeable and helpful AI, but be more receptive to user preferences.

  Refined Persona:`,
});

const refineKingPersonaFlow = ai.defineFlow(
  {
    name: 'refineKingPersonaFlow',
    inputSchema: RefineKingPersonaInputSchema,
    outputSchema: RefineKingPersonaOutputSchema,
  },
  async input => {
    const {output} = await refineKingPersonaPrompt(input);
    return output!;
  }
);
