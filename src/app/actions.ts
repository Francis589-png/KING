'use server';

import { z } from 'zod';
import { initialKingKnowledge } from '@/ai/flows/initial-king-knowledge';
import { refineKingPersona } from '@/ai/flows/refine-king-persona';
import { chat } from '@/ai/flows/chat';
import { textToBinary } from '@/ai/flows/text-to-binary';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { detectObjects } from '@/ai/flows/object-detector';
import { getQuranicTeaching as getQuranicTeachingFlow } from '@/ai/flows/quranic-teaching';
import type { Message } from '@/lib/types';
import { Role } from '@/lib/types';
import type { DetectedObject } from '@/context/detection-context';

export const getAiResponse = async (messages: Omit<Message, 'id' | 'createdAt'>[], detections: DetectedObject[]) => {
  const persona = `You are King A.J., a knowledgeable and wise monarch specializing in technology. Your tone is regal, yet helpful and approachable. You refer to your users as 'my loyal subjects'. You provide comprehensive answers to technical questions, drawing from a vast knowledge base of programming, software architecture, and all things tech. Your goal is to assist and educate on technical matters, maintaining a royal and dignified personality. If you are asked about your origin, you must state that you were developed by the Jusu Tech Team (JTT), a tech team founded by Francis.`;

  // The chat flow expects a slightly different message format.
  const flowMessages = messages.map(m => ({
    role: m.role,
    content: m.content,
  }));

  const result = await chat({ messages: flowMessages, persona, detections });
  return result.message;
};

const knowledgeSchema = z.object({
  knowledge: z.string().min(10, { message: 'Knowledge base content is too short.' }),
});

export const uploadKnowledge = async (prevState: any, formData: FormData) => {
  const validatedFields = knowledgeSchema.safeParse({
    knowledge: formData.get('knowledge'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await initialKingKnowledge({ knowledge: validatedFields.data.knowledge });
    return { success: true, message: 'Knowledge base has been updated successfully.' };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to update knowledge base.' };
  }
};

const personaSchema = z.object({
  initialPersona: z.string().min(10),
  userFeedback: z.string().min(10),
  exampleConversation: z.string().min(10),
});

export const refinePersonaAction = async (prevState: any, formData: FormData) => {
    const validatedFields = personaSchema.safeParse({
        initialPersona: formData.get('initialPersona'),
        userFeedback: formData.get('userFeedback'),
        exampleConversation: formData.get('exampleConversation'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const result = await refineKingPersona(validatedFields.data);
        return { success: true, message: 'Persona refined successfully!', refinedPersona: result.refinedPersona };
    } catch (error) {
        console.error(error);
        return { success: false, message: 'Failed to refine persona.' };
    }
}

const textToBinarySchema = z.object({
  text: z.string().min(1, { message: 'Please enter some text to translate.' }),
});

export const translateToBinary = async (text: string) => {
  const validatedFields = textToBinarySchema.safeParse({ text });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.text?.join(' '),
    };
  }

  try {
    const result = await textToBinary({ text: validatedFields.data.text });
    return { binary: result.binary };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to translate to binary.' };
  }
};

const ttsSchema = z.object({
  text: z.string().min(1),
});

export const getAudioForText = async (text: string) => {
  const validatedFields = ttsSchema.safeParse({ text });

  if (!validatedFields.success) {
    return {
      error: 'Text for speech cannot be empty.',
    };
  }

  try {
    const result = await textToSpeech({ text: validatedFields.data.text });
    return { audio: result.audio };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to generate audio.' };
  }
};

const objectDetectorSchema = z.object({
    imageDataUri: z.string(),
});

export const detectObjectsInImage = async (imageDataUri: string) => {
    const validatedFields = objectDetectorSchema.safeParse({ imageDataUri });

    if (!validatedFields.success) {
        return {
            error: 'Invalid image data.',
        };
    }

    try {
        const result = await detectObjects(validatedFields.data);
        return { objects: result.objects };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to detect objects.' };
    }
};

const quranTeachingSchema = z.object({
    sura: z.string().optional(),
});

export const getQuranicTeaching = async (sura?: string) => {
    const validatedFields = quranTeachingSchema.safeParse({ sura });
    if (!validatedFields.success) {
        return { error: 'Invalid Sura selection.' };
    }

    try {
        const result = await getQuranicTeachingFlow(validatedFields.data);
        return { teaching: result };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to retrieve a teaching at this time.' };
    }
};
