const defaultSettings = {
  minRate: 0.9,
  maxRate: 1.1,
};
let settings = defaultSettings;

function loadSettings() {
  chrome.storage.sync.get(defaultSettings, s => { settings = s; });
}

const subtitleQueue = [];
let speaking = false;
let lastSubtitleEndTime = performance.now();

function observeSubtitles() {
  const target = document.querySelector('.ytp-caption-window-container');
  if (!target) return;
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        const text = node.innerText?.trim();
        if (text) enqueueSubtitle(text);
      });
    });
  });
  observer.observe(target, { childList: true, subtree: true });
}

function enqueueSubtitle(text) {
  const timestamp = performance.now();
  adjustPlayback(lastSubtitleEndTime - timestamp);
  subtitleQueue.push({ text, timestamp });
  processQueue();
}

function processQueue() {
  if (speaking || subtitleQueue.length === 0) return;
  const { text } = subtitleQueue.shift();
  speaking = true;
  chrome.runtime.sendMessage({ type: 'speak', text }, response => {
    if (response?.url) {
      const audio = new Audio(response.url);
      audio.volume = settings.volume ?? 1;
      audio.addEventListener('loadedmetadata', () => {
        lastSubtitleEndTime = performance.now() + audio.duration * 1000;
      });
      audio.addEventListener('ended', () => {
        lastSubtitleEndTime = performance.now();
        speaking = false;
        adjustPlayback(0);
        processQueue();
      });
      audio.play();
    } else {
      lastSubtitleEndTime = performance.now();
      speaking = false;
      processQueue();
    }
  });
}

function adjustPlayback(diff) {
  const video = document.querySelector('video');
  if (!video) return;
  if (Math.abs(diff) < 300) {
    video.playbackRate = 1;
    return;
  }
  if (diff > 0) {
    video.playbackRate = Math.max(settings.minRate, video.playbackRate - 0.05);
  } else {
    video.playbackRate = Math.min(settings.maxRate, video.playbackRate + 0.05);
  }
}

loadSettings();
const checkInterval = setInterval(() => {
  const container = document.querySelector('.ytp-caption-window-container');
  if (container) {
    observeSubtitles();
    clearInterval(checkInterval);
  }
}, 1000);
