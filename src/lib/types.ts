
import { z } from 'zod';

export enum Role {
  user = 'user',
  assistant = 'assistant',
}

export const Message = z.object({
  id: z.string(),
  role: z.nativeEnum(Role),
  content: z.string(),
  createdAt: z.date(),
});

export type Message = z.infer<typeof Message>;

// Types for alquran.cloud API response
const VerseTextSchema = z.object({
  arabic: z.string(),
  english: z.string(),
});

const VerseSchema = z.object({
  number: z.number(),
  text: VerseTextSchema,
  numberInSurah: z.number(),
  juz: z.number(),
  manzil: z.number(),
  ruku: z.number(),
  hizbQuarter: z.number(),
  sajda: z.union([z.boolean(), z.object({
    id: z.number(),
    recommended: z.boolean(),
    obligatory: z.boolean(),
  })]),
});

export const SuraSchema = z.object({
  number: z.number(),
  name: z.string(),
  englishName: z.string(),
  englishNameTranslation: z.string(),
  revelationType: z.string(),
  numberOfAyahs: z.number(),
  verses: z.array(VerseSchema),
});

export type Sura = z.infer<typeof SuraSchema>;
