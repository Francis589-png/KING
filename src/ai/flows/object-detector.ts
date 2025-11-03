'use server';
/**
 * @fileOverview An AI flow to detect objects in an image.
 *
 * - detectObjects - A function that detects objects in an image.
 * - DetectObjectsInput - The input type for the detectObjects function.
 * - DetectObjectsOutput - The return type for the detectObjects function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DetectObjectsInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type DetectObjectsInput = z.infer<typeof DetectObjectsInputSchema>;

const DetectObjectsOutputSchema = z.object({
    objects: z.array(z.object({
        name: z.string().describe('The name of the detected object.'),
        confidence: z.number().describe('The confidence score of the detection, from 0 to 1.'),
    })).describe('A list of objects detected in the image.'),
});
export type DetectObjectsOutput = z.infer<typeof DetectObjectsOutputSchema>;

export async function detectObjects(input: DetectObjectsInput): Promise<DetectObjectsOutput> {
  return objectDetectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'objectDetectorPrompt',
  input: { schema: DetectObjectsInputSchema },
  output: { schema: DetectObjectsOutputSchema },
  prompt: `You are an expert object detection model. Analyze the provided image and identify the objects within it. For each object, provide its name and a confidence score.

Image: {{media url=imageDataUri}}`,
});

const objectDetectorFlow = ai.defineFlow(
  {
    name: 'objectDetectorFlow',
    inputSchema: DetectObjectsInputSchema,
    outputSchema: DetectObjectsOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
