let queue = [];
let processing = false;
let observer;
let lastText = "";
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

async function init() {
  const settings = await chrome.storage.sync.get([
    "language",
    "translate",
    "speechRate",
    "minRate",
    "maxRate"
  ]);
  observeCaptions(settings);
}

function observeCaptions(settings) {
  const container = document.querySelector(".ytp-caption-window-container");
  if (!container) {
    setTimeout(() => observeCaptions(settings), 1000);
    return;
  }

  observer = new MutationObserver((mutations) => {
    mutations.forEach((m) => {
      m.addedNodes.forEach((node) => {
        const text = node.textContent.trim();
        if (text && text !== lastText) {
          lastText = text;
          const start = parseFloat(node.parentElement?.dataset?.start || 0);
          const dur = parseFloat(node.parentElement?.dataset?.dur || 0);
          queue.push({ text, start, dur, settings });
          processQueue();
        }
      });
    });
  });

  observer.observe(container, { childList: true, subtree: true });
}

async function processQueue() {
  if (processing || !queue.length) return;
  processing = true;

  const item = queue.shift();
  let text = item.text;
  const settings = item.settings;

  if (settings.translate) {
    const res = await chrome.runtime.sendMessage({ type: "TRANSLATE", text });
    text = res.translated || text;
  }

  let res = await chrome.runtime.sendMessage({ type: "TTS", text });
  if (res.error) return (processing = false);

  const subtitleDur = item.dur;
  let audioDur = res.duration;
  let speakingRate = settings.speechRate;
  let playRate = 1.0;

  if (audioDur > subtitleDur) {
    speakingRate = Math.max(settings.minRate, (speakingRate * subtitleDur) / audioDur);
    if (speakingRate === settings.minRate) {
      playRate = (subtitleDur / audioDur) * playRate;
    }
  } else if (audioDur < subtitleDur) {
    speakingRate = Math.min(settings.maxRate, (speakingRate * subtitleDur) / audioDur);
    if (speakingRate === settings.maxRate) {
      playRate = (subtitleDur / audioDur) * playRate;
    }
  }

  if (speakingRate !== settings.speechRate) {
    res = await chrome.runtime.sendMessage({ type: "TTS", text, speakingRate });
    audioDur = res.duration;
  }

  if (playRate !== 1.0) {
    document.querySelector("video").playbackRate = playRate;
  }

  const source = audioCtx.createBufferSource();
  source.buffer = res.audioBuffer;
  source.connect(audioCtx.destination);
  source.start(0);

  source.onended = () => {
    processing = false;
    processQueue();
  };
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "DISABLE") {
    queue = [];
    processing = false;
    observer && observer.disconnect();
  }
});

init();
