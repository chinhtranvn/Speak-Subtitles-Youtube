export async function synthesize(text, settings, speechRate) {
  const body = {
    input: { text },
    voice: { languageCode: settings.language, name: settings.voice },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: speechRate,
      pitch: settings.pitch,
      volumeGainDb: (settings.volume - 1) * 16
    }
  };
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${settings.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data.audioContent;
}
