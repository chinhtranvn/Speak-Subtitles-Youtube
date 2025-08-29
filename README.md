# Speak-Subtitles-Youtube

Chrome extension that reads YouTube subtitles aloud using Google Cloud
Text-to-Speech. It fetches caption tracks directly so it works even when
YouTube's subtitle display is turned off. If a track in your configured
language is unavailable it can translate captions before speaking.

Subtitles are spoken sequentially without overlap. The extension adjusts
both voice speed and video playback rate so the audio, text, and video
stay synchronized.

## Development

The extension lives in the `extension` directory. Load it as an unpacked
extension in Chrome to try it out.

### Scripts

```bash
npm test
```
Currently there are no automated tests.
