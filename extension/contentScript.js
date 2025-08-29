const defaultSettings = {
  minRate: 0.9,
  maxRate: 1.1,
};
let settings = defaultSettings;

function loadSettings() {
  chrome.storage.sync.get(defaultSettings, s => { settings = s; });
}

function observeSubtitles() {
  const target = document.querySelector('.ytp-caption-window-container');
  if (!target) return;
  const observer = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        const text = node.innerText?.trim();
        if (text) speakText(text);
      });
    });
  });
  observer.observe(target, { childList: true, subtree: true });
}

async function speakText(text) {
  const start = performance.now();
  chrome.runtime.sendMessage({ type: 'speak', text }, response => {
    if (response?.url) {
      const audio = new Audio(response.url);
      audio.volume = settings.volume ?? 1;
      audio.play();
      audio.addEventListener('ended', () => {
        const diff = performance.now() - start - audio.duration * 1000;
        adjustPlayback(diff);
      });
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
