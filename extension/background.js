const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

async function translateText(text, target, key) {
  const res = await fetch(`${TRANSLATE_ENDPOINT}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target })
  });
  if (!res.ok) {
    throw new Error(`Translate request failed: ${res.status}`);
  }
  const data = await res.json();
  if (data.error?.message) {
    throw new Error(data.error.message);
  }
  return data.data?.translations?.[0]?.translatedText || text;
}

async function synthesizeSpeech(text, settings, rate) {
  const body = {
    input: { text },
    voice: { languageCode: settings.language, name: settings.voice },
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: settings.pitch,
      speakingRate: rate || 1.0,
      volumeGainDb: settings.volume
    }
  };
  const res = await fetch(`${TTS_ENDPOINT}?key=${settings.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    throw new Error(`TTS request failed: ${res.status}`);
  }
  const data = await res.json();
  if (data.error?.message) {
    throw new Error(data.error.message);
  }
  return data.audioContent ? `data:audio/mp3;base64,${data.audioContent}` : null;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'speak') {
    chrome.storage.sync.get(null, async settings => {
      if (!settings.apiKey) {
        sendResponse({ error: 'Missing API key' });
        return;
      }
      if (!settings.voice) {
        sendResponse({ error: 'No voice selected' });
        return;
      }
      let text = msg.text;
      const shouldTranslate = msg.translate ?? settings.translate;
      try {
        if (shouldTranslate) {
          text = await translateText(text, settings.language, settings.apiKey);
        }
        const url = await synthesizeSpeech(text, settings, msg.rate);
        sendResponse({ url });
      } catch (e) {
        console.error('TTS pipeline failed', e);
        sendResponse({ url: null, error: e.message });
      }
    });
    return true; // keep the message channel open for async response
  }
});
