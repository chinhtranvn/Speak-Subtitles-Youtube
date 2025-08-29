let settings = null;
let enabled = false;
let queue = [];
let processing = false;
const seen = new Set();

async function init() {
  settings = await sendMessage({ type: 'getSettings' });
  enabled = settings.enabled;
  if (enabled) attach();
}

function attach() {
  const video = document.querySelector('video');
  if (!video) return;
  for (const track of video.textTracks) {
    track.mode = 'hidden';
    track.addEventListener('cuechange', () => {
      for (const cue of track.activeCues) {
        const key = `${cue.startTime}-${cue.endTime}-${cue.text}`;
        if (!seen.has(key)) {
          seen.add(key);
          queue.push({ text: cue.text, start: cue.startTime, end: cue.endTime, language: track.language });
          processQueue();
        }
      }
    });
  }
}

async function processQueue() {
  if (processing || !enabled) return;
  processing = true;
  while (queue.length && enabled) {
    const item = queue.shift();
    let text = item.text;
    if (settings.translate && item.language !== settings.language) {
      const res = await sendMessage({ type: 'translate', text, source: item.language });
      text = res.text;
    }
    await speak(text, item.end - item.start);
  }
  processing = false;
}

async function speak(text, subtitleDuration) {
  let speechRate = settings.speechRate;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  let audio = await getAudio(text, speechRate);
  let buffer = await decodeAudio(ctx, audio);
  let audioDuration = buffer.duration;

  if (audioDuration > subtitleDuration) {
    while (audioDuration > subtitleDuration && speechRate > settings.minRate) {
      speechRate = Math.max(settings.minRate, speechRate - 0.1);
      audio = await getAudio(text, speechRate);
      buffer = await decodeAudio(ctx, audio);
      audioDuration = buffer.duration;
    }
    if (audioDuration > subtitleDuration) {
      const video = document.querySelector('video');
      video.playbackRate = Math.max(0.5, video.playbackRate - 0.1);
    }
  } else if (audioDuration < subtitleDuration) {
    while (audioDuration < subtitleDuration && speechRate < settings.maxRate) {
      speechRate = Math.min(settings.maxRate, speechRate + 0.1);
      audio = await getAudio(text, speechRate);
      buffer = await decodeAudio(ctx, audio);
      audioDuration = buffer.duration;
    }
    if (audioDuration < subtitleDuration) {
      const video = document.querySelector('video');
      video.playbackRate = Math.min(2, video.playbackRate + 0.1);
    }
  }

  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = settings.volume;
  source.buffer = buffer;
  source.connect(gain).connect(ctx.destination);
  source.start();
  await new Promise((resolve) => (source.onended = resolve));
}

function getAudio(text, speechRate) {
  return sendMessage({ type: 'speak', text, speechRate }).then((r) => r.audioContent);
}

function decodeAudio(ctx, audioContent) {
  const bytes = Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0));
  return ctx.decodeAudioData(bytes.buffer);
}

function sendMessage(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.enabled) {
    enabled = changes.enabled.newValue;
    if (enabled) {
      attach();
      processQueue();
    } else {
      queue = [];
    }
  }
});

init();
