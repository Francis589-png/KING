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
