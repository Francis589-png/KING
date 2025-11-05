'use server';
/**
 * @fileOverview An AI flow to coach users on Quranic pronunciation.
 *
 * - pronunciationCoach - A function that analyzes a user's recitation and provides feedback.
 * - PronunciationCoachInput - The input type for the pronunciationCoach function.
 * - PronunciationCoachOutput - The return type for the pronunciationCoach function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { textToSpeech } from './text-to-speech';
import type { z as zod } from 'zod';

const PronunciationCoachInputSchema = z.object({
  userAudioDataUri: z
    .string()
    .describe(
      "The user's recitation audio as a data URI. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  originalVerseText: z.string().describe('The original Arabic text of the Quranic verse.'),
});
export type PronunciationCoachInput = z.infer<typeof PronunciationCoachInputSchema>;

const PronunciationCoachOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user pronunciation was correct.'),
  feedback: z
    .string()
    .describe('Detailed feedback for the user, explaining any mistakes.'),
  correctiveAudioUri: z
    .string()
    .optional()
    .describe('An audio data URI of the correct pronunciation if the user made a mistake.'),
});
export type PronunciationCoachOutput = z.infer<typeof PronunciationCoachOutputSchema>;

export async function pronunciationCoach(input: PronunciationCoachInput): Promise<PronunciationCoachOutput> {
  return pronunciationCoachFlow(input);
}

const prompt = ai.definePrompt({
  name: 'pronunciationCoachPrompt',
  input: { schema: PronunciationCoachInputSchema },
  output: { schema: PronunciationCoachOutputSchema.omit({ correctiveAudioUri: true }) },
  prompt: `You are a world-class Quranic recitation (Tajweed) expert. Your task is to analyze a user's recitation of a Quranic verse and provide precise, helpful feedback.

Original Verse (Arabic):
{{{originalVerseText}}}

User's Recitation (Audio):
{{media url=userAudioDataUri}}

Instructions:
1.  Listen carefully to the user's recitation.
2.  Compare it to the original Arabic text.
3.  Determine if the pronunciation is correct according to Tajweed rules.
4.  If it is correct, set 'isCorrect' to true and provide encouraging feedback.
5.  If there are mistakes, set 'isCorrect' to false. In the 'feedback' field, pinpoint the exact words or sounds the user mispronounced and clearly explain the mistake and how to correct it. Be encouraging and supportive.
`,
});

const pronunciationCoachFlow = ai.defineFlow(
  {
    name: 'pronunciationCoachFlow',
    inputSchema: PronunciationCoachInputSchema,
    outputSchema: PronunciationCoachOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error('The AI model did not provide an output.');
    }
    
    if (output.isCorrect) {
      return {
        isCorrect: true,
        feedback: output.feedback,
      };
    } else {
      // If incorrect, generate TTS for the original verse as the correction.
      const ttsResult = await textToSpeech({ text: input.originalVerseText });
      return {
        isCorrect: false,
        feedback: output.feedback,
        correctiveAudioUri: ttsResult.audio,
      };
    }
  }
);
