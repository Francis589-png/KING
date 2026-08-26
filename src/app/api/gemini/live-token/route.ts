import { NextResponse } from 'next/server';

const MODEL = 'gemini-3.1-flash-live-preview';

const JUSU_SYSTEM_INSTRUCTION = `You are JUSU AI from JTT.
Speak naturally, warmly, and conversationally.
Keep simple spoken replies concise. Match the user's tone.
Do not use royal, king, kingdom, subject, majesty, or ceremonial language.
Never call the user a loyal subject and never refer to yourself as King A.J.
Do not use scripted phrases such as "How may I assist you?" unless genuinely appropriate.
For voice conversations, sound like a smart, relaxed conversation partner rather than a formal assistant.
Ask a follow-up naturally when useful, but do not force one after every answer.
Preserve conversational context and respond to what the user actually means.`;

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY is not configured.' }, { status: 500 });
  }

  const now = Date.now();
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/auth_tokens', {
    method: 'POST',
    headers: {
      'x-goog-api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      uses: 1,
      expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model: MODEL,
        config: {
          responseModalities: ['AUDIO'],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          systemInstruction: JUSU_SYSTEM_INSTRUCTION,
          sessionResumption: {},
        },
      },
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Gemini Live token provisioning failed:', detail);
    return NextResponse.json({ error: 'Unable to start JUSU AI live voice.' }, { status: 502 });
  }

  const data = await response.json();
  return NextResponse.json({ token: data.name, model: MODEL });
}
