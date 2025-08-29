# Speak-Subtitles-Youtube

Chrome extension that reads YouTube subtitles aloud using Google Cloud
Text-to-Speech and optionally translates captions before speaking.

Subtitles are read sequentially and the extension adjusts video playback
speed to maintain sync with spoken captions.

## Development

The extension lives in the `extension` directory. Load it as an unpacked
extension in Chrome to try it out.

### Scripts

```bash
npm test
```
Currently there are no automated tests.
