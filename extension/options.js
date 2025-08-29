const defaultSettings = {
  apiKey: '',
  language: 'en-US',
  translate: false,
  voice: 'en-US-Wavenet-D',
  pitch: 0,
  volume: 1,
  minRate: 0.9,
  maxRate: 1.1
};

function saveOptions(e) {
  e.preventDefault();
  const settings = {
    apiKey: document.getElementById('apiKey').value,
    language: document.getElementById('language').value,
    translate: document.getElementById('translate').checked,
    voice: document.getElementById('voice').value,
    pitch: parseFloat(document.getElementById('pitch').value) || 0,
    volume: parseFloat(document.getElementById('volume').value) || 1,
    minRate: parseFloat(document.getElementById('minRate').value) || 0.9,
    maxRate: parseFloat(document.getElementById('maxRate').value) || 1.1,
  };
  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.textContent = 'Saved.';
    setTimeout(() => status.textContent = '', 1500);
  });
}

function restoreOptions() {
  chrome.storage.sync.get(defaultSettings, (items) => {
    document.getElementById('apiKey').value = items.apiKey || '';
    document.getElementById('language').value = items.language || 'en-US';
    document.getElementById('translate').checked = items.translate || false;
    document.getElementById('voice').value = items.voice || '';
    document.getElementById('pitch').value = items.pitch ?? 0;
    document.getElementById('volume').value = items.volume ?? 1;
    document.getElementById('minRate').value = items.minRate ?? 0.9;
    document.getElementById('maxRate').value = items.maxRate ?? 1.1;
  });
}

document.getElementById('settings-form').addEventListener('submit', saveOptions);
document.addEventListener('DOMContentLoaded', restoreOptions);
