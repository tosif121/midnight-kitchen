# MediaPipe Hand Landmarker Model

Download the hand tracking model file from:

```
https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task
```

Place the downloaded `hand_landmarker.task` file in this directory.

## About

The `hand_landmarker.task` file is a machine learning model (~23 MB) that detects hand landmarks in real-time from video input. It's required for the game to track your palm and fingers.

## Setup

1. Download from: https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task
2. Save to: `models/hand_landmarker.task`
3. Restart your local server

## CORS

For local development (file:// or localhost:8080), the model loads without CORS issues.

For production (Vercel), ensure:
- The file is in the public directory
- Vercel serves it with proper CORS headers
- Or host the model on a CDN with `crossorigin` attribute in index.html

## File Size

- **Download size**: ~23 MB
- **Loaded size**: ~25 MB in memory
- **First load**: ~1-2 seconds (cached afterwards)

## License

The model is provided by Google MediaPipe under the Apache 2.0 License.
