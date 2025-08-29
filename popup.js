import { loadSettings, saveSettings } from './storage.js';

const q = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await loadSettings();
  q('apiKey').value = settings.apiKey;
  q('language').value = settings.language;
  q('translate').checked = settings.translate;
  q('voice').value = settings.voice;
  q('pitch').value = settings.pitch;
  q('volume').value = settings.volume;
  q('speechRate').value = settings.speechRate;
  q('minRate').value = settings.minRate;
  q('maxRate').value = settings.maxRate;
  updateLabels();

  ['pitch', 'volume', 'speechRate'].forEach((id) => {
    q(id).addEventListener('input', updateLabels);
  });

  q('save').addEventListener('click', async () => {
    const newSettings = {
      apiKey: q('apiKey').value,
      language: q('language').value,
      translate: q('translate').checked,
      voice: q('voice').value,
      pitch: parseFloat(q('pitch').value),
      volume: parseFloat(q('volume').value),
      speechRate: parseFloat(q('speechRate').value),
      minRate: parseFloat(q('minRate').value),
      maxRate: parseFloat(q('maxRate').value)
    };
    await saveSettings(newSettings);
    window.close();
  });
});

function updateLabels() {
  q('pitchVal').textContent = q('pitch').value;
  q('volumeVal').textContent = q('volume').value;
  q('rateVal').textContent = q('speechRate').value;
}
