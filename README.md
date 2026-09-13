# Fresh Squeeze — Sip Cold Orange Juice with Your Hands

An interactive in-browser AR camera experience where you reach out, grab a striped drinking straw from a transparent glass, and sip chilled, fresh orange juice using real-time hand and face tracking.

Built with vanilla JavaScript ES modules, HTML5 Canvas 2D, and MediaPipe Vision Tasks. Runs 100% locally on device.

---

## ✨ Features

- 🍊 **Transparent Glass & Cold Juice Rendering**:
  - Transparent highball crystal glass with double-wall refraction and edge highlights.
  - Heavy solid glass base with crystal facets and table shadow caustics.
  - Chilled orange juice with a warm, sunlit citrus gradient (`#FF5722` → `#FFA726` → `#FFD54F`).
  - Fluid surface meniscus with wave oscillations.
  - 3D floating crystalline ice cubes bobbing with fluid buoyancy.
  - Realistic cold condensation beads glistening on the exterior.
  - Fresh orange wheel slice garnish hooked onto the rim.
- 🥤 **Interactive Straw & Sipping Mechanics**:
  - Candy-striped straw extending out of the glass at an angle with refraction below the liquid.
  - Grab the straw with a hand pinch / grip gesture (or drag with mouse/touch).
  - Bring the straw to your lips: magnetically snaps to your mouth.
  - **Pucker to Sip**: Orange juice visibly surges up through the straw with real-time suction bubbles.
  - Thirst meter fills up and the juice level drains smoothly with each sip.
- ✨ **Refreshing Celebrations & Audio**:
  - Pulling away or releasing triggers a burst of golden citrus droplets and sparkle mist.
  - Built-in sound effects via Web Audio API (ice clink on grab, bubbly straw suction, and sparkle chime).
- 🔒 **Private & Secure**:
  - All vision processing runs entirely in your browser. Nothing is recorded, stored, or sent to any server.

---

## 🚀 Quick Start

### 1. Prerequisites
- A modern web browser with WebGL and WebRTC support (Chrome, Edge, Safari, Firefox).
- Local camera (optional; mouse and touch fallback are also supported).

### 2. Run Local Server
```bash
# Using Python 3
python3 -m http.server 8080

# Or with Node.js
npx http-server -p 8080
```

### 3. Open in Browser
Navigate to:
```
http://localhost:8080
```

---

## 🎮 How to Play

1. **Start**: Click **"Turn on my camera"** and allow camera permission.
2. **Grab**: Reach your hand toward the straw tip and pinch/close your fingers to grab it.
3. **Bring to Mouth**: Move the straw up to your lips until it snaps into place.
4. **Sip**: Pucker your lips to sip cold orange juice through the straw!
5. **Shortcuts**:
   - Press **`R`** to refill the glass and reset the straw.
   - Press **`D`** to toggle FPS and tracking diagnostics.

---

## 📁 File Structure

```
midnight-kitchen/
├── index.html              # Main HTML markup & HUD interface
├── web/
│   └── style.css          # Citrus sunrise theme & glassmorphic styling
├── dist/
│   └── app.min.js         # Core game logic, vision tracking & 2D canvas rendering
├── models/
│   ├── hand_landmarker.task  # MediaPipe hand tracking model
│   └── face_landmarker.task  # MediaPipe face tracking model
├── assets/                 # Icons and graphics
├── sw.js                   # Service worker for offline model caching
├── vercel.json             # Deployment configuration
└── README.md               # Documentation
```

---

## 🛠️ Technology Stack

- **MediaPipe Tasks Vision**: Real-time hand landmark and face blendshape detection.
- **Canvas 2D API**: Multi-layer crystal glass rendering, liquid physics, and particle simulation.
- **Web Audio API**: Procedural sound synthesis (bubbly straw suction, clinks, chimes).
- **Vanilla JavaScript**: Zero framework overhead, native ES modules.
