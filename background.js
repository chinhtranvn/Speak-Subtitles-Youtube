import { synthesize, translateText } from "./tts.js";
import { getSettings, saveSettings, getEnabled } from "./storage.js";

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await saveSettings(settings);
});

chrome.action.onClicked.addListener(async (tab) => {
  const enabled = !(await getEnabled());
  await saveSettings({ ...(await getSettings()), enabled });
  const url = tab.url || "";
  const canAccess = /^https?:/.test(url);
  if (!canAccess) return;

  if (enabled) {
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
    } catch (e) {
      console.error("Failed to inject content script", e);
    }
  } else {
    chrome.tabs.sendMessage(tab.id, { type: "DISABLE" }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const settings = await getSettings();
    if (!settings.enabled) return sendResponse({ error: "disabled" });

    if (msg.type === "TRANSLATE") {
      const translated = await translateText(msg.text, settings.language, settings.apiKey);
      sendResponse({ translated });
    }

    if (msg.type === "TTS") {
      try {
        const audio = await synthesize(msg.text, {
          ...settings,
          speechRate: msg.speakingRate ?? settings.speechRate
        });
        sendResponse(audio);
      } catch (e) {
        sendResponse({ error: e.message });
      }
    }
  })();
  return true;
});
