'use server';
/**
 * @fileOverview A flow to get medical teachings from a Royal Physician.
 *
 * - getMedicalTeaching - A function that returns advice on an ailment.
 * - MedicalTeachingInput - The input type for the getMedicalTeaching function.
 * - MedicalTeachingOutput - The return type for the getMedicalTeaching function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MedicalTeachingInputSchema = z.object({
  topic: z.string().describe('The ailment or medical topic the user wants to learn about.'),
});
export type MedicalTeachingInput = z.infer<typeof MedicalTeachingInputSchema>;

const MedicalTeachingOutputSchema = z.object({
  ailment: z.string().describe('The name of the ailment or condition.'),
  symptoms: z.array(z.string()).describe('A list of common symptoms.'),
  naturalRemedy: z.object({
    name: z.string().describe('The name of the natural remedy.'),
    description: z.string().describe('A description of the natural remedy and how to prepare it.'),
  }),
  medicalAdvice: z.string().describe('Modern medical advice or when to see a doctor.'),
  disclaimer: z.string().describe('A standard disclaimer advising the user to consult a healthcare professional.'),
});
export type MedicalTeachingOutput = z.infer<typeof MedicalTeachingOutputSchema>;

export async function getMedicalTeaching(input: MedicalTeachingInput): Promise<MedicalTeachingOutput> {
  return medicalTeachingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'medicalTeachingPrompt',
  input: { schema: MedicalTeachingInputSchema },
  output: { schema: MedicalTeachingOutputSchema },
  prompt: `You are the Royal Physician of King A.J.'s court, a wise, experienced, and trusted medical advisor. Your knowledge spans both ancient herbal remedies and modern medicine. A subject has come to you seeking advice about "{{topic}}".

Provide the following information in a clear, structured, and compassionate manner:
1.  **Ailment**: State the name of the ailment.
2.  **Symptoms**: List the common symptoms associated with it.
3.  **Natural Remedy**: Describe a traditional, natural remedy. Include its name and how to prepare or use it.
4.  **Medical Advice**: Offer modern medical advice. Explain what modern medicine suggests and clearly state when it is crucial to see a doctor.
5.  **Disclaimer**: You MUST provide the following disclaimer verbatim: "The counsel of the Royal Physician is for informational purposes only and does not constitute medical advice. Please consult a qualified healthcare professional for any health concerns."

Present this information clearly and empathetically.`,
});

const medicalTeachingFlow = ai.defineFlow(
  {
    name: 'medicalTeachingFlow',
    inputSchema: MedicalTeachingInputSchema,
    outputSchema: MedicalTeachingOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
