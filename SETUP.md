# Fresh Squeeze — Setup & Architecture Guide

## Overview

Fresh Squeeze is an AR web application built with vanilla JavaScript and MediaPipe Vision Tasks. It renders an interactive 2D canvas with a transparent highball glass of chilled orange juice and a striped drinking straw.

## Getting Started

### 1. Prerequisites
- Modern browser supporting WebGL and WebRTC.
- Both MediaPipe models are stored locally in `models/`:
  - `models/hand_landmarker.task`
  - `models/face_landmarker.task`

### 2. Launch Local Server
```bash
# Start local server on port 8080
python3 -m http.server 8080
```

### 3. Open in Browser
Open `http://localhost:8080` in Chrome, Safari, Edge, or Firefox.

## Project Architecture

```
midnight-kitchen/
├── index.html              # Main HTML markup, HUD and dialogs
├── web/
│   └── style.css          # Citrus sunrise theme & glassmorphic styles
├── dist/
│   └── app.min.js         # Core game logic, vision tracking & 2D canvas rendering
├── models/
│   ├── hand_landmarker.task  # MediaPipe hand landmarker
│   └── face_landmarker.task  # MediaPipe face landmarker
├── sw.js                   # Service worker for offline asset caching
├── vercel.json             # Deployment configuration
├── README.md               # Overview documentation
└── SETUP.md                # Architecture & setup guide
```

## Core Systems in `dist/app.min.js`

1. **`GlassDrinkRenderer`**:
   - Renders the transparent highball glass, crystal base, liquid gradient, surface meniscus, floating ice cubes, orange slice garnish, and condensation beads.
2. **`StrawController`**:
   - Manages inverse kinematics, flexible bend, dynamic juice suction column, and hand/mouth magnetic snapping.
3. **`VisionDetector`**:
   - Interfaces with MediaPipe `HandLandmarker` and `FaceLandmarker`. Calculates pinch/grip score and blendshapes (`mouthPucker`, `mouthFunnel`).
4. **`SoundFx`**:
   - Web Audio API procedural sound synthesizer (bubbly straw suction, crystal clink, and celebration chime).
5. **`ParticleSystem`**:
   - Citrus splash droplets and sparkling vitamin C stars.
