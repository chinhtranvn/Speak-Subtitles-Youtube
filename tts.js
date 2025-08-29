export async function synthesize(text, settings) {
  const { apiKey, language, voiceName, pitch, volume, speechRate } = settings;

  const body = {
    input: { text },
    voice: { languageCode: language, name: voiceName || undefined },
    audioConfig: {
      audioEncoding: "MP3",
      pitch,
      speakingRate: speechRate,
      volumeGainDb: volume
    }
  };

  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  if (!json.audioContent) throw new Error(json.error?.message || "TTS failed");

  const audioData = atob(json.audioContent);
  const buffer = new Uint8Array(audioData.length);
  for (let i = 0; i < audioData.length; i++) buffer[i] = audioData.charCodeAt(i);

  const ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)();
  const audioBuffer = await ctx.decodeAudioData(buffer.buffer);

  return {
    audioBuffer,
    duration: audioBuffer.duration
  };
}

export async function translateText(text, target, apiKey) {
  const body = { q: text, target };
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const json = await res.json();
  return json.data?.translations?.[0]?.translatedText || text;
}
