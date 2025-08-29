import { loadSettings, saveSettings } from './storage.js';
import { synthesize } from './tts.js';

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await loadSettings();
  if (settings.enabled === undefined) {
    await saveSettings({ enabled: false });
  }
});

chrome.action.onClicked.addListener(async (tab) => {
  const settings = await loadSettings();
  const enabled = !settings.enabled;
  await saveSettings({ enabled });
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'enabled', enabled });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'getSettings') {
    loadSettings().then((s) => sendResponse(s));
    return true;
  }
  if (msg.type === 'speak') {
    loadSettings().then((settings) => {
      synthesize(msg.text, settings, msg.speechRate).then((audioContent) => {
        sendResponse({ audioContent });
      });
    });
    return true;
  }
  if (msg.type === 'translate') {
    loadSettings().then(async (settings) => {
      const text = await translateText(msg.text, msg.source, settings.language, settings.apiKey);
      sendResponse({ text });
    });
    return true;
  }
});

async function translateText(text, source, target, apiKey) {
  if (source === target) return text;
  const res = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' })
  });
  const data = await res.json();
  return data.data?.translations?.[0]?.translatedText || text;
}
