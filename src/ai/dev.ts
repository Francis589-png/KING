import { config } from 'dotenv';
config();

import '@/ai/flows/initial-king-knowledge.ts';
import '@/ai/flows/summarize-conversation.ts';
import '@/ai/flows/refine-king-persona.ts';
import '@/ai/flows/chat.ts';
