import { getSettings, saveSettings } from "./storage.js";

document.addEventListener("DOMContentLoaded", async () => {
  const s = await getSettings();
  document.getElementById("apiKey").value = s.apiKey;
  document.getElementById("language").value = s.language;
  document.getElementById("translate").checked = s.translate;
  document.getElementById("pitch").value = s.pitch;
  document.getElementById("volume").value = s.volume;
  document.getElementById("speechRate").value = s.speechRate;
  document.getElementById("minRate").value = s.minRate;
  document.getElementById("maxRate").value = s.maxRate;

  await loadVoices(s.language, s.apiKey, s.voiceName);

  document.getElementById("language").addEventListener("change", async (e) => {
    await loadVoices(e.target.value, document.getElementById("apiKey").value);
  });

  document.getElementById("save").addEventListener("click", async () => {
    const settings = {
      apiKey: document.getElementById("apiKey").value.trim(),
      language: document.getElementById("language").value,
      translate: document.getElementById("translate").checked,
      voiceName: document.getElementById("voiceName").value,
      pitch: parseFloat(document.getElementById("pitch").value),
      volume: parseFloat(document.getElementById("volume").value),
      speechRate: parseFloat(document.getElementById("speechRate").value),
      minRate: parseFloat(document.getElementById("minRate").value),
      maxRate: parseFloat(document.getElementById("maxRate").value)
    };
    await saveSettings(settings);
    alert("Saved!");
  });
});

async function loadVoices(language, apiKey, selected = "") {
  const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?languageCode=${language}&key=${apiKey}`);
  const json = await res.json();
  const voices = json.voices || [];
  const select = document.getElementById("voiceName");
  select.innerHTML = "";
  voices.forEach(v => {
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.ssmlGender})`;
    if (v.name === selected) opt.selected = true;
    select.appendChild(opt);
  });
}
