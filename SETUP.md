# The Midnight Kitchen — Build Complete

All files have been successfully created and pushed to GitHub.

## Repository
https://github.com/tosif121/midnight-kitchen

## Setup & Run

### 1. Download MediaPipe Model
```bash
mkdir -p models
curl -o models/hand_landmarker.task \
  https://storage.googleapis.com/mediapipe-assets/hand_landmarker.task
```

### 2. Start Local Server
```bash
python3 -m http.server 8080
```

### 3. Open Browser
```
http://localhost:8080
```

## Project Structure
```
midnight-kitchen/
├── index.html              # Main HTML with dialogs & canvas
├── web/
│   ├── style.css          # Chalkboard theme styling
│   └── app.js             # Complete game logic (962 lines)
├── models/
│   └── hand_landmarker.task  # Download separately (~23 MB)
├── vercel.json            # Deployment config
├── .gitignore
├── README.md              # Full documentation
└── SETUP.md               # This file
```

## Features Implemented

### Core Gameplay
- ✅ Hand tracking via MediaPipe
- ✅ 4-state machine (IDLE → HOVERING → CAPTURING → RELEASING)
- ✅ Meter fill system (30% threshold for valid serve)
- ✅ Steam particle physics with per-dish tuning
- ✅ 5 serves to unlock Midnight Specials

### Menu System
- ✅ 5 dishes (Chai, Biryani, Platter, Burger, Sandwich)
- ✅ 3 chips (mint, hot oil, cola)
- ✅ 3 specials (chai refill, butter chicken, loaded fries)
- ✅ Dish/chip/special selection with visual feedback

### UI & UX
- ✅ Chalkboard night market aesthetic
- ✅ Open invitation dialog
- ✅ Menu card with selections
- ✅ Receipt/tab tracking
- ✅ Toast notifications
- ✅ Steam gauge & hint line

### Accessibility
- ✅ Keyboard navigation (Tab, Enter, Esc)
- ✅ Focus indicators
- ✅ ARIA labels
- ✅ prefers-reduced-motion support
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Safe-area insets for notched devices

### Sharing
- ✅ URL params: ?dish=chai&chip=mint&special=chai-refill
- ✅ Share button (Web Share API + clipboard fallback)
- ✅ URL round-trip parsing

## Testing Checklist

### Gameplay Flow
- [ ] Open page → see open invitation
- [ ] Click "Open the kitchen" → camera permission dialog
- [ ] Canvas renders with chalkboard, dish, flame
- [ ] Hold open palm over pot → meter fills
- [ ] Move hand up → steam particles burst
- [ ] Serve counted if meter > 30%
- [ ] After 5 serves → specials unlock (dock glows)
- [ ] Click menu → select different dish
- [ ] Click menu → select chip
- [ ] Close/reset → see receipt
- [ ] Check serves count in footer

### Responsive
- [ ] Desktop: all UI visible
- [ ] Tablet (< 768px): bar wraps
- [ ] Mobile (< 480px): dock at top, font sizes smaller

### Accessibility
- [ ] Tab through buttons
- [ ] Esc closes dialogs
- [ ] Focus outlines visible (brass color)
- [ ] Toast messages appear
- [ ] prefers-reduced-motion: no wobble (dev tools → rendering)

### Sharing
- [ ] Copy share URL
- [ ] Paste in new tab
- [ ] Loads with selected dish/chip/special
- [ ] Toast shows: "Tonight: [Dish] · [Chip] · [Special]"

## Known Limitations

1. **MediaPipe Model**: hand_landmarker.task (~23 MB) must be downloaded separately
2. **Camera**: HTTPS required on production (HTTP works locally)
3. **Serve Pose**: Simplified (single hand only; full dual-hand detection available)
4. **Browser**: IE 11 not supported (ES modules required)

## Deployment (Vercel)

1. Repo already pushed to GitHub
2. Import to Vercel dashboard
3. Add model file to `public/models/hand_landmarker.task` OR update modelAssetPath to CDN
4. Deploy (no build command needed)

## File Sizes

- index.html: ~15 KB
- web/style.css: ~50 KB
- web/app.js: ~45 KB
- hand_landmarker.task: ~23 MB (separate download)

---

**Status**: ✅ READY FOR LOCAL TESTING
