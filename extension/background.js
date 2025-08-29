const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

async function translateText(text, target, key) {
  const res = await fetch(`${TRANSLATE_ENDPOINT}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target })
  });
  const data = await res.json();
  return data.data?.translations?.[0]?.translatedText || text;
}

async function synthesizeSpeech(text, settings) {
  const body = {
    input: { text },
    voice: { languageCode: settings.language, name: settings.voice },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: settings.pitch,
      speakingRate: 1.0,
      volumeGainDb: settings.volume
    }
  };
  const res = await fetch(`${TTS_ENDPOINT}?key=${settings.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  return data.audioContent ? `data:audio/mp3;base64,${data.audioContent}` : null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'speak') {
    chrome.storage.sync.get(null, async settings => {
      let text = msg.text;
      if (settings.translate) {
        try {
          text = await translateText(text, settings.language, settings.apiKey);
        } catch (e) {
          console.error('Translation failed', e);
        }
      }
      try {
        const url = await synthesizeSpeech(text, settings);
        sendResponse({ url });
      } catch (e) {
        console.error('TTS failed', e);
        sendResponse({ url: null });
      }
    });
    return true; // keep the message channel open for async response
  }
});
