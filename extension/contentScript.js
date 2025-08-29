const defaultSettings = {
  apiKey: '',
  language: 'en-US',
  translate: false,
  voice: '',
  pitch: 0,
  volume: 1,
  minRate: 0.9,
  maxRate: 1.1,
};
let settings = { ...defaultSettings };

let captions = [];
let nextCaption = 0;
const subtitleQueue = [];
let speaking = false;
let currentVideoId = '';

function loadSettings(cb) {
  chrome.storage.sync.get(defaultSettings, s => {
    settings = { ...defaultSettings, ...s };
    if (cb) cb();
  });
}

function clamp(v, min, max) {
  return Math.min(Math.max(v, min), max);
}

function parseVTT(data) {
  const cues = [];
  const re = /([0-9:.]+)\s-->\s([0-9:.]+)[^\n]*\n([\s\S]*?)(?=\n\n|$)/g;
  let m;
  while ((m = re.exec(data)) !== null) {
    const start = timeToSeconds(m[1]);
    const end = timeToSeconds(m[2]);
    const text = m[3].replace(/\n/g, ' ').trim();
    cues.push({ start, end, text });
  }
  return cues;
}

function timeToSeconds(t) {
  const parts = t.split(':');
  return parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
}

function fetchCaptions() {
  captions = [];
  nextCaption = 0;
  const playerResponse = window.ytInitialPlayerResponse;
  const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) return;
  let track = tracks.find(t => t.languageCode === settings.language);
  let translate = false;
  if (!track) {
    track = tracks[0];
    translate = true;
  }
  fetch(track.baseUrl + '&fmt=vtt')
    .then(r => r.text())
    .then(vtt => {
      captions = parseVTT(vtt).map(c => ({ ...c, translate }));
    })
    .catch(e => console.error('Failed to load captions', e));
}

function checkVideo() {
  const params = new URLSearchParams(location.search);
  const vid = params.get('v');
  if (vid && vid !== currentVideoId) {
    currentVideoId = vid;
    fetchCaptions();
  }
}

function checkCaptions() {
  const video = document.querySelector('video');
  if (!video || nextCaption >= captions.length) return;
  const current = video.currentTime;
  const cap = captions[nextCaption];
  if (current >= cap.start && !cap.enqueued) {
    cap.enqueued = true;
    enqueue(cap);
    nextCaption++;
  }
}

function enqueue(caption) {
  subtitleQueue.push(caption);
  processQueue();
}

function processQueue() {
  if (speaking || subtitleQueue.length === 0) return;
  const caption = subtitleQueue.shift();
  speaking = true;
  const needTranslate = caption.translate || settings.translate;
  chrome.runtime.sendMessage({ type: 'speak', text: caption.text, rate: 1, translate: needTranslate }, response => {
    if (response?.url) {
      const audio = new Audio(response.url);
      audio.volume = settings.volume ?? 1;
      audio.addEventListener('loadedmetadata', () => {
        const expected = caption.end - caption.start;
        const voiceRate = clamp(audio.duration / expected, settings.minRate, settings.maxRate);
        audio.playbackRate = voiceRate;
        const voiceDuration = audio.duration / voiceRate;
        const video = document.querySelector('video');
        if (video) {
          const videoRate = clamp(expected / voiceDuration, settings.minRate, settings.maxRate);
          video.playbackRate = videoRate;
          audio.addEventListener('ended', () => {
            video.playbackRate = 1;
            speaking = false;
            processQueue();
          });
        } else {
          audio.addEventListener('ended', () => {
            speaking = false;
            processQueue();
          });
        }
        audio.play();
      });
    } else {
      speaking = false;
      processQueue();
    }
  });
}

loadSettings(() => {
  checkVideo();
  setInterval(checkVideo, 1000);
  setInterval(checkCaptions, 200);
});
