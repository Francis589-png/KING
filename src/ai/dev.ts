import { config } from 'dotenv';
config();

import '@/ai/flows/initial-king-knowledge.ts';
import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/refine-king-persona.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/text-to-binary.ts';
import '@/ai/flows/text-to-speech.ts';
import '@/ai/flows/object-detector.ts';
import '@/ai/flows/quranic-teaching.ts';
