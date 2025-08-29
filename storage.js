const DEFAULTS = {
  apiKey: '',
  language: 'vi-VN',
  translate: false,
  voice: 'vi-VN-Standard-A',
  pitch: 0,
  volume: 1,
  speechRate: 1,
  minRate: 0.8,
  maxRate: 1.2,
  enabled: false
};

export function loadSettings() {
  return new Promise((resolve) => chrome.storage.sync.get(DEFAULTS, resolve));
}

export function saveSettings(settings) {
  return new Promise((resolve) => chrome.storage.sync.set(settings, resolve));
}
