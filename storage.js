export const defaultSettings = {
  apiKey: "",
  language: "vi-VN",
  translate: true,
  voiceName: "",
  pitch: 0,
  volume: 0,
  speechRate: 1.0,
  minRate: 0.8,
  maxRate: 1.2,
  enabled: false
};

export async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (items) => resolve(items));
  });
}

export async function saveSettings(settings) {
  return new Promise((resolve) => {
    chrome.storage.sync.set(settings, () => resolve());
  });
}

export async function getEnabled() {
  return new Promise((r) => chrome.storage.sync.get({ enabled: false }, (v) => r(v.enabled)));
}
