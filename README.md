# The Midnight Kitchen — the all-night steam counter

An original AR web game where you catch steam from dishes using hand tracking. Built with vanilla JavaScript, MediaPipe, and canvas rendering.

## Features

- 🎮 **Hand Tracking**: Real-time palm detection using MediaPipe HandLandmarker
- 🍛 **5 Dishes**: Kulhad Chai, Chicken Biryani, Dinner Platter, Double Burger, Club Sandwich
- 🌶️ **3 Condiments**: mint chutney, hot oil, cola drizzle
- ✨ **Midnight Specials**: Unlock at 5 serves (chai refill, butter chicken, loaded fries)
- 💨 **Particle Effects**: Dynamic steam physics with per-dish tuning
- 📱 **Responsive**: Works on desktop, tablet, and mobile
- ♿ **Accessible**: Keyboard navigation, ARIA labels, prefers-reduced-motion support
- 📤 **Share**: Copy/paste tab URLs with full game state
- 🎬 **No Framework**: Pure vanilla JS ES modules, no build step

## Setup

### Prerequisites

- Modern browser with:
  - ES module support
  - WebGL (for canvas rendering)
  - WebRTC (for camera access)
  - MediaPipe support
- Camera access required to play

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/tosif121/midnight-kitchen.git
   cd midnight-kitchen
   ```

2. **Download the MediaPipe hand tracking model**

   Download `hand_landmarker.task` from:
   ```
   https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task
   ```

   Place it in the `models/` directory:
   ```bash
   mkdir -p models
   # Download and place hand_landmarker.task in models/
   ```

3. **Start a local server**

   ```bash
   # Python 3
   python3 -m http.server 8080

   # Or with Node.js (if you have http-server installed)
   npx http-server -p 8080

   # Or with Ruby
   ruby -run -ehttpd . -p8080
   ```

4. **Open in browser**
   ```
   http://localhost:8080
   ```

### Deployment to Vercel

1. Push to GitHub
2. Import repo to Vercel
3. **Important**: Add environment variable or placeholder for model file
4. Download `hand_landmarker.task` and place it in `public/models/`
5. Deploy

Alternatively, serve the model from a CDN:
- Update `index.html` line with `modelAssetPath` to point to CDN URL
- Or use Vercel's static file serving with proper CORS headers

## Gameplay

### How to Play

1. **Open the Kitchen**: Click "Open the kitchen" to start
2. **Select Your Dish**: Click the dock pill to open the menu and pick a dish (and optional chip/special)
3. **Catch Steam**:
   - Hold your **open palm** over the pot at the bottom of the screen
   - Wait 400ms for the game to recognize your hand
   - The steam meter will fill as you hold your palm steady
   - When the meter reaches 100% or you move your hand up, the steam releases
4. **Serve**: If the meter was above 30% when released, it counts as a **serve**
5. **Unlock Specials**: After 5 serves, special dishes unlock (shown with a glow on the dish button)
6. **See Your Tab**: Click "Pay & close" or close the app to see tonight's receipt

### Serve Pose (Power-Up)

Hold **both hands flat and aligned** side-by-side near the pot for 1.2 seconds to arm the **Serve Pose**. Your next release will be a **double burst** and count as 2 serves.

### Share

Copy your tab URL from the share button and send it to friends. They'll load with the same dish/chip/special selected.

## File Structure

```
midnight-kitchen/
├── index.html              # Main HTML file with dialogs and canvas
├── web/
│   ├── style.css          # All styling (chalkboard theme)
│   └── app.js             # Game logic, hand tracking, state machine
├── models/
│   └── hand_landmarker.task  # MediaPipe model (download separately)
├── vercel.json            # Vercel deployment config
├── .gitignore             # Git ignore file
└── README.md              # This file
```

## Technical Details

### State Machine

The game uses a four-state flow:

1. **IDLE**: No hand detected or hand moved out of zone
2. **HOVERING**: Hand detected in pot zone, waiting for stability (400ms)
3. **CAPTURING**: Hand confirmed stable, meter filling as user holds
4. **RELEASING**: Steam burst triggered, pause before next capture (500ms)

### Hand Detection

- Detects open palm via fingertip-to-MCP distance thresholds
- Wrist position determines zone (pot, release, elsewhere)
- Supports up to 2 hands for serve-pose detection
- Runs at ~30 FPS using RequestAnimationFrame

### Steam Physics

Each particle simulates:
- Gravity (inverted, rising)
- Velocity drag (air resistance)
- Growth radius over lifetime
- Wobble (sin-wave jitter, optional via prefers-reduced-motion)
- Alpha fade-out

Dish/chip/special modifiers control:
- Lift speed
- Curl amount
- Particle density
- Color tint

### Canvas Rendering

- Custom chalkboard backdrop (SVG-inspired doodles)
- Dish illustration (colored circle + highlight)
- Flame beneath (quadratic Bezier)
- Steam particles (lighten blend mode for additive effect)
- No external canvas library, pure 2D context

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+ (camera may require permissions dialog)
- Mobile: iOS Safari 14+, Android Chrome 90+

## Accessibility

- Full keyboard navigation (Tab, Enter, Esc)
- Focus indicators (brass-colored outlines)
- ARIA labels on buttons and progress bars
- Toast notifications with role="status" for screen readers
- Respects `prefers-reduced-motion` for animations
- Responsive layout with safe-area insets for notched devices

## Performance

- ~60 FPS target (capped with dt clamp)
- Max 220 simultaneous particles
- Hand tracking runs only when video is ready
- Canvas rendering synced with requestAnimationFrame
- No external dependencies beyond MediaPipe (loaded via CDN)

## Design Notes

### Visual Identity: "Chalkboard Night Market"

- **Colors**: Wood charcoal (#221812), brass accents (#D49A3F), chalk text (#F6EBD6), muted (#C9B89A)
- **Typography**: Caveat (handwritten chalk), Nunito (UI), IBM Plex Mono (menu tags)
- **Aesthetic**: Night-shift kitchen ledger, hand-drawn chalk on wood
- **No emojis**: Copy uses only text and hand-crafted ASCII/Unicode

### Explicitly Avoided

- Smoke/tobacco references
- Charcoal/ivory/slate color schemes (used warm wood instead)
- Lora serif font
- Film grain, vignettes, scrims
- Circular step badges
- Hose/pinch-to-mouth gestures
- Tin/antique card aesthetics

## Known Limitations

1. **Model File**: `hand_landmarker.task` must be downloaded separately (~23 MB)
2. **Camera Access**: Requires HTTPS on production (HTTP works locally)
3. **GPU Acceleration**: Best performance on devices with GPU support
4. **Serve Pose**: Currently simplified; full implementation needs dual-hand tracking validation

## Future Enhancements

- Add sound effects (ambient hum, steam release sounds)
- Leaderboard (local storage)
- Multiplayer (WebSocket sync)
- More dishes and condiments
- Custom dish creator
- Seasonal themes

## License

Original concept by the specification. Made with ❤️ by nycanshu.

## Credits

- **MediaPipe**: Hand tracking by Google
- **Google Fonts**: Caveat, Nunito, IBM Plex Mono
- **Concept**: "The Midnight Kitchen" — an all-night steam counter

---

**Open till the last craving.**
