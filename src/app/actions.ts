
'use server';

import { z } from 'zod';
import { initialKingKnowledge } from '@/ai/flows/initial-king-knowledge';
import { refineKingPersona } from '@/ai/flows/refine-king-persona';
import { chat } from '@/ai/flows/chat';
import { textToBinary } from '@/ai/flows/text-to-binary';
import { textToSpeech } from '@/ai/flows/text-to-speech';
import { detectObjects } from '@/ai/flows/object-detector';
import { pronunciationCoach } from '@/ai/flows/pronunciation-coach';
import type { Message, Sura } from '@/lib/types';
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

export const getSuraFromAPI = async (suraNumber: number): Promise<{ sura?: Sura; error?: string; }> => {
    const suraSchema = z.number().int().min(1).max(114);
    const validation = suraSchema.safeParse(suraNumber);
    if (!validation.success) {
        return { error: 'Invalid Sura number.' };
    }

    try {
        // Fetch Arabic text and English translation in parallel
        const [arabicRes, translationRes] = await Promise.all([
            fetch(`http://api.alquran.cloud/v1/surah/${suraNumber}`),
            fetch(`http://api.alquran.cloud/v1/surah/${suraNumber}/en.sahih`)
        ]);

        if (!arabicRes.ok || !translationRes.ok) {
            throw new Error('Failed to fetch data from alquran.cloud');
        }

        const arabicData = await arabicRes.json();
        const translationData = await translationRes.json();
        
        if (arabicData.code !== 200 || translationData.code !== 200) {
            throw new Error(arabicData.data || 'Failed to retrieve Sura from API.');
        }

        const combinedSura: Sura = {
            ...arabicData.data,
            verses: arabicData.data.ayahs.map((ayah: any, index: number) => {
                return {
                    number: ayah.number,
                    numberInSurah: ayah.numberInSurah,
                    juz: ayah.juz,
                    manzil: ayah.manzil,
                    ruku: ayah.ruku,
                    hizbQuarter: ayah.hizbQuarter,
                    sajda: ayah.sajda,
                    text: {
                        arabic: ayah.text,
                        english: translationData.data.ayahs[index].text,
                    },
                };
            }),
        };

        // The API returns ayahs, but we call them verses internally
        delete (combinedSura as any).ayahs;


        return { sura: combinedSura };

    } catch (error: any) {
        console.error(error);
        return { error: error.message || 'Failed to retrieve the Sura at this time.' };
    }
};


const pronunciationCoachSchema = z.object({
    userAudioDataUri: z.string(),
    originalVerseText: z.string(),
});

export const getRecitationFeedback = async (userAudioDataUri: string, originalVerseText: string) => {
    const validatedFields = pronunciationCoachSchema.safeParse({ userAudioDataUri, originalVerseText });
    if (!validatedFields.success) {
        return { error: 'Invalid input for pronunciation analysis.' };
    }

    try {
        const result = await pronunciationCoach(validatedFields.data);
        return { feedback: result };
    } catch (error) {
        console.error(error);
        return { error: 'Failed to analyze recitation.' };
    }
}
