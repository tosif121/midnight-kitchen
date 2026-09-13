import * as Vision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';

const { FaceLandmarker, HandLandmarker, PoseLandmarker } = Vision;

// ============ CONSTANTS & CONFIG ============
const DISH_DATA = {
  '01': {
    name: 'Kulhad Chai',
    slug: 'chai',
    color: '#D49A3F',
    mood: 'warm amber, slow curls',
    steam: {
      lift: 1.2,
      curl: 0.8,
      growth: 1.05,
      drag: 0.92,
      density: 40,
      radius: 12,
      jitter: 1.2,
      tint: '#E8A54B'
    }
  },
  '02': {
    name: 'Chicken Biryani',
    slug: 'biryani',
    color: '#B96A3B',
    mood: 'rich spice, dense',
    steam: {
      lift: 0.9,
      curl: 0.6,
      growth: 1.03,
      drag: 0.88,
      density: 60,
      radius: 16,
      jitter: 0.8,
      tint: '#C97A3D'
    }
  },
  '03': {
    name: 'Dinner Platter',
    slug: 'platter',
    color: '#7B6B4F',
    mood: 'hearty, steady',
    steam: {
      lift: 1.0,
      curl: 0.7,
      growth: 1.04,
      drag: 0.90,
      density: 45,
      radius: 14,
      jitter: 1.0,
      tint: '#9B8B6F'
    }
  },
  '04': {
    name: 'Double Burger',
    slug: 'burger',
    color: '#6E4A2F',
    mood: 'thick white puffs',
    steam: {
      lift: 1.3,
      curl: 0.5,
      growth: 1.06,
      drag: 0.95,
      density: 50,
      radius: 20,
      jitter: 0.6,
      tint: '#D4B5A0'
    }
  },
  '05': {
    name: 'Club Sandwich',
    slug: 'sandwich',
    color: '#7F9155',
    mood: 'crisp, quick knots',
    steam: {
      lift: 1.4,
      curl: 1.0,
      growth: 1.07,
      drag: 0.94,
      density: 35,
      radius: 10,
      jitter: 1.4,
      tint: '#9FB573'
    }
  }
};

const CHIP_DATA = {
  'mint': {
    name: 'mint chutney',
    modifier: {
      speedMult: 1.3,
      densityMult: 0.8,
      liftMult: 1.2,
      tint: '#8FB573'
    }
  },
  'gex': {
    name: 'hot oil',
    modifier: {
      speedMult: 1.2,
      densityMult: 1.1,
      liftMult: 1.15,
      tint: '#FF6B4B'
    }
  },
  'cola': {
    name: 'cola drizzle',
    modifier: {
      speedMult: 0.8,
      densityMult: 1.2,
      liftMult: 0.9,
      tint: '#8B6D47'
    }
  }
};

const SPECIAL_DATA = {
  'chai-refill': {
    name: 'chai refill',
    price: 40,
    effect: 'secondary-wisp'
  },
  'butter-chicken': {
    name: 'butter chicken',
    price: 80,
    effect: 'gravy-golden'
  },
  'loaded-fries': {
    name: 'loaded fries',
    price: 60,
    effect: 'brass-sparks'
  }
};

const DISH_PRICES = {
  '01': 80,
  '02': 140,
  '03': 120,
  '04': 100,
  '05': 110
};

const CHIP_PRICES = {
  'mint': 20,
  'gex': 25,
  'cola': 20
};

const POT_ZONE = { x: 0.40, y: 0.75, w: 0.20, h: 0.17 };
const RELEASE_ZONE = { y: 0.10, y2: 0.60 };

const STATE = {
  IDLE: 'idle',
  HOVERING: 'hovering',
  CAPTURING: 'capturing',
  RELEASING: 'releasing'
};

const HAND_OPEN_THRESHOLD = 0.06;
const HOVER_STABLE_TIME = 400;
const SERVE_POSE_HOLD_TIME = 1200;
const RELEASE_PAUSE = 500;
const METER_FILL_RATE = 0.09;
const MAX_PARTICLES = 220;

// ============ STATE ============
let state = {
  kitchenOpen: false,
  currentDish: '01',
  currentChip: null,
  currentSpecial: null,
  serves: 0,
  meter: 0,
  steamParticles: [],
  lastHoverTime: 0,
  lastReleaseTime: 0,
  currentState: STATE.IDLE,
  handLandmarks: null,
  canvasWidth: 0,
  canvasHeight: 0,
  servePoseArmed: false,
  servePoseStartTime: 0,
  hoverStartTime: 0,
  hoverStartPos: null,
  releaseStartPos: null,
  reduceMotion: false,
  session: {
    tab: []
  }
};

// ============ ELEMENTS ============
const elements = {
  canvas: null,
  video: null,
  openDialog: null,
  openButton: null,
  menuDialog: null,
  tabDialog: null,
  dockPill: null,
  steamGauge: null,
  toastContainer: null,
  hintLine: null,
  passLabel: null,
  servesCount: null,
  dishName: null,
  payCloseButton: null,
  cancelMenuButton: null,
  applyMenuButton: null,
  specialsLocked: null,
  specialsList: null,
  menuStatus: null
};

// ============ MEDIAPIPE SETUP ============
let handLandmarker;
let runningMode = 'VIDEO';

async function initHandLandmarker() {
  try {
    const vision = await Vision;
    handLandmarker = await vision.HandLandmarker.createFromOptions(
      vision,
      {
        baseOptions: {
          modelAssetPath: '/models/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode,
        numHands: 2
      }
    );
    console.log('HandLandmarker initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize HandLandmarker:', error);
    showToast('Hand tracking unavailable. Model file missing.', 'info');
    return false;
  }
}

// ============ INITIALIZATION ============
async function init() {
  // Cache elements
  elements.canvas = document.getElementById('stage');
  elements.video = document.getElementById('cam');
  elements.openDialog = document.getElementById('openDialog');
  elements.openButton = document.getElementById('openButton');
  elements.menuDialog = document.getElementById('menuDialog');
  elements.tabDialog = document.getElementById('tabDialog');
  elements.dockPill = document.getElementById('dockPill');
  elements.steamGauge = document.getElementById('steamGauge');
  elements.toastContainer = document.getElementById('toastContainer');
  elements.hintLine = document.getElementById('hintLine');
  elements.passLabel = document.getElementById('passLabel');
  elements.servesCount = document.getElementById('servesCount');
  elements.dishName = document.getElementById('dishName');
  elements.payCloseButton = document.getElementById('payCloseButton');
  elements.cancelMenuButton = document.getElementById('cancelMenuButton');
  elements.applyMenuButton = document.getElementById('applyMenuButton');
  elements.specialsLocked = document.getElementById('specialsLocked');
  elements.specialsList = document.getElementById('specialsList');
  elements.menuStatus = document.getElementById('menuStatus');

  // Check for reduced motion
  state.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Setup canvas
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Setup video
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' }
    });
    elements.video.srcObject = stream;
    elements.video.play();
  } catch (error) {
    console.error('Camera access denied:', error);
    showToast('Camera access required to play', 'info');
  }

  // Initialize MediaPipe
  await initHandLandmarker();

  // Setup event listeners
  setupEventListeners();

  // Parse URL params
  parseShareURL();

  // Show open screen
  elements.openDialog.showModal();

  // Start animation loop
  requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const container = elements.canvas.parentElement;
  state.canvasWidth = container.clientWidth;
  state.canvasHeight = container.clientHeight;
  elements.canvas.width = state.canvasWidth;
  elements.canvas.height = state.canvasHeight;
}

function setupEventListeners() {
  elements.openButton.addEventListener('click', openKitchen);
  elements.dockPill.addEventListener('click', showMenu);
  elements.cancelMenuButton.addEventListener('click', closeMenu);
  elements.applyMenuButton.addEventListener('click', applyMenuAndClose);
  elements.payCloseButton.addEventListener('click', resetSession);

  // Menu plate selection
  document.querySelectorAll('.menu-plate').forEach(btn => {
    btn.addEventListener('click', () => selectDish(btn.dataset.id));
  });

  // Menu chip selection
  document.querySelectorAll('.menu-chip').forEach(btn => {
    btn.addEventListener('click', () => selectChip(btn.dataset.id));
  });

  // Menu special selection
  document.querySelectorAll('.menu-special-item').forEach(btn => {
    btn.addEventListener('click', () => selectSpecial(btn.dataset.id));
  });

  // Keyboard: Esc closes dialogs
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.menuDialog.open) closeMenu();
      if (elements.tabDialog.open) elements.tabDialog.close();
    }
  });

  // Share button (if added to menu)
  const shareBtn = document.querySelector('[data-action="share"]');
  if (shareBtn) {
    shareBtn.addEventListener('click', shareTab);
  }
}

// ============ KITCHEN FLOW ============
function openKitchen() {
  state.kitchenOpen = true;
  elements.openDialog.close();
  showToast('Welcome to the Midnight Kitchen', 'info');
}

function showMenu() {
  updateMenuUI();
  elements.menuDialog.showModal();
}

function closeMenu() {
  elements.menuDialog.close();
}

function applyMenuAndClose() {
  updateMenuStatus();
  elements.menuDialog.close();
  updateDockPill();
}

function updateMenuUI() {
  // Update plate selection
  document.querySelectorAll('.menu-plate').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === state.currentDish);
  });

  // Update chip selection
  document.querySelectorAll('.menu-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === state.currentChip);
  });

  // Update special selection
  document.querySelectorAll('.menu-special-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === state.currentSpecial);
  });

  updateMenuStatus();
}

function updateMenuStatus() {
  const dish = DISH_DATA[state.currentDish];
  let status = `Tonight: ${dish.name}`;
  if (state.currentChip) status += ` · ${CHIP_DATA[state.currentChip].name}`;
  if (state.currentSpecial) status += ` · ${SPECIAL_DATA[state.currentSpecial].name}`;
  elements.menuStatus.textContent = status;
}

function updateDockPill() {
  const dish = DISH_DATA[state.currentDish];
  elements.dockPill.textContent = `Dish: ${dish.name}`;
}

function selectDish(id) {
  state.currentDish = id;
  updateMenuUI();
}

function selectChip(id) {
  state.currentChip = state.currentChip === id ? null : id;
  updateMenuUI();
}

function selectSpecial(id) {
  state.currentSpecial = state.currentSpecial === id ? null : id;
  updateMenuUI();
}

// ============ HAND TRACKING & CAPTURE ============
function isHandOpen(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const getDistance = (a, b) => {
    const dx = landmarks[a].x - landmarks[b].x;
    const dy = landmarks[a].y - landmarks[b].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Check if all fingertips are extended (distance from MCP to fingertip)
  const distances = [
    getDistance(8, 6),   // Index
    getDistance(12, 10), // Middle
    getDistance(16, 14), // Ring
    getDistance(20, 18)  // Pinky
  ];

  return distances.every(d => d > HAND_OPEN_THRESHOLD);
}

function getWristPosition(landmarks) {
  if (!landmarks || landmarks.length < 1) return null;
  return {
    x: landmarks[0].x,
    y: landmarks[0].y
  };
}

function isInPotZone(wrist) {
  if (!wrist) return false;
  const relX = (wrist.x - POT_ZONE.x);
  const relY = (wrist.y - POT_ZONE.y);
  return relX >= 0 && relX <= POT_ZONE.w && relY >= 0 && relY <= POT_ZONE.h;
}

function isInReleaseZone(wrist) {
  if (!wrist) return false;
  return wrist.y >= RELEASE_ZONE.y && wrist.y <= RELEASE_ZONE.y2;
}

function updateHandTracking() {
  if (!handLandmarker || !elements.video.readyState) return;

  try {
    const result = handLandmarker.detectForVideo(elements.video, performance.now());
    state.handLandmarks = result.landmarks.length > 0 ? result.landmarks[0] : null;
  } catch (error) {
    console.error('Hand tracking error:', error);
  }
}

function updateGameState() {
  if (!state.kitchenOpen) return;

  const landmarks = state.handLandmarks;
  const now = performance.now();

  // No hand detected
  if (!landmarks) {
    if (state.currentState === STATE.HOVERING) {
      state.currentState = STATE.IDLE;
      state.meter = 0;
      updateHint('Hover your palm over the dish to catch steam');
    }
    return;
  }

  const wrist = getWristPosition(landmarks);
  const isOpen = isHandOpen(landmarks);
  const inPot = isInPotZone(wrist);
  const inRelease = isInReleaseZone(wrist);

  // State machine
  switch (state.currentState) {
    case STATE.IDLE:
      if (inPot && isOpen) {
        state.hoverStartTime = now;
        state.hoverStartPos = wrist;
        state.currentState = STATE.HOVERING;
        updateHint('Hold steady... building steam');
      }
      break;

    case STATE.HOVERING:
      if (!inPot || !isOpen) {
        state.currentState = STATE.IDLE;
        state.meter = 0;
        updateHint('Hover your palm over the dish to catch steam');
      } else if (now - state.hoverStartTime >= HOVER_STABLE_TIME) {
        state.currentState = STATE.CAPTURING;
        state.releaseStartPos = wrist;
        updateHint('Steam building! Hold tight...');
      }
      break;

    case STATE.CAPTURING:
      if (!inPot) {
        // Release trigger
        triggerRelease(wrist);
      } else {
        // Fill meter
        if (state.meter < 100) {
          const fillAmount = METER_FILL_RATE;
          state.meter = Math.min(100, state.meter + fillAmount);
          updateMeter();

          if (state.meter >= 100) {
            triggerRelease(wrist);
          }
        }
      }
      break;

    case STATE.RELEASING:
      if (now - state.lastReleaseTime >= RELEASE_PAUSE) {
        state.currentState = STATE.IDLE;
        state.meter = 0;
        updateMeter();
        updateHint('Hover your palm over the dish to catch steam');
      }
      break;
  }

  // Check serve pose (both hands, side by side, held)
  checkServePose();
}

function triggerRelease(position) {
  state.currentState = STATE.RELEASING;
  state.lastReleaseTime = performance.now();

  const meterThreshold = 30;
  if (state.meter >= meterThreshold) {
    const isBurst = state.servePoseArmed;
    createSteamRelease(position, isBurst);
    recordServe(isBurst);
    state.servePoseArmed = false;
  }

  state.meter = 0;
  updateMeter();
}

function checkServePose() {
  if (!state.handLandmarks) return;

  // This would need to detect two hands in the video feed
  // For now, simplified: check if meter is at certain level
  // In full implementation, would check HandLandmarker results for 2+ hands
  // and validate their proximity and alignment
}

function recordServe(isDouble = false) {
  const servesAdd = isDouble ? 2 : 1;
  state.serves += servesAdd;
  elements.servesCount.textContent = state.serves;
  elements.dishName.textContent = DISH_DATA[state.currentDish].slug;

  // Add to tab
  const dish = DISH_DATA[state.currentDish];
  const tabItem = {
    type: 'dish',
    name: dish.name,
    price: DISH_PRICES[state.currentDish]
  };
  state.session.tab.push(tabItem);

  if (state.currentChip) {
    const chip = CHIP_DATA[state.currentChip];
    state.session.tab.push({
      type: 'chip',
      name: chip.name,
      price: CHIP_PRICES[state.currentChip]
    });
  }

  if (state.currentSpecial) {
    const special = SPECIAL_DATA[state.currentSpecial];
    state.session.tab.push({
      type: 'special',
      name: special.name,
      price: special.price
    });
  }

  const message = isDouble ? `SERVED! +${servesAdd} serves` : `Serve counted! (${state.serves} total)`;
  showToast(message, 'success');

  // Unlock specials at 5 serves
  if (state.serves === 5) {
    unlockSpecials();
  }
}

function unlockSpecials() {
  elements.specialsLocked.classList.add('hidden');
  elements.specialsList.classList.remove('hidden');
  elements.dockPill.classList.add('glow');
  showToast('The lights are on — late menu\'s up.', 'info');
}

// ============ STEAM PARTICLES ============
function createSteamRelease(position, isDouble = false) {
  const dish = DISH_DATA[state.currentDish];
  const steamConfig = { ...dish.steam };

  // Apply chip modifiers
  if (state.currentChip) {
    const chipMod = CHIP_DATA[state.currentChip].modifier;
    steamConfig.lift *= chipMod.liftMult;
    steamConfig.density *= chipMod.densityMult;
  }

  // Apply special effects
  if (state.currentSpecial) {
    const special = SPECIAL_DATA[state.currentSpecial];
    if (special.effect === 'brass-sparks') {
      // Add some spark particles
      for (let i = 0; i < 8; i++) {
        state.steamParticles.push(createParticle(position, { ...steamConfig, tint: '#D49A3F', radius: 6 }));
      }
    }
  }

  const count = isDouble ? steamConfig.density * 2 : steamConfig.density;
  for (let i = 0; i < count; i++) {
    state.steamParticles.push(createParticle(position, steamConfig));
  }

  if (state.steamParticles.length > MAX_PARTICLES) {
    state.steamParticles = state.steamParticles.slice(-MAX_PARTICLES);
  }
}

function createParticle(position, config) {
  const angle = Math.random() * Math.PI * 2;
  const jitter = config.jitter || 1;
  return {
    x: position.x * state.canvasWidth + (Math.random() - 0.5) * 20 * jitter,
    y: position.y * state.canvasHeight + (Math.random() - 0.5) * 20 * jitter,
    vx: Math.cos(angle) * (Math.random() * 100 + 50),
    vy: -Math.random() * 200 - 100,
    lifetime: 2000 + Math.random() * 1000,
    age: 0,
    radius: config.radius || 12,
    tint: config.tint,
    gravity: -config.lift * 50,
    drag: config.drag,
    growth: config.growth
  };
}

function updateSteamParticles(dt) {
  state.steamParticles = state.steamParticles.filter(p => {
    p.age += dt;
    if (p.age >= p.lifetime) return false;

    const progress = p.age / p.lifetime;

    // Physics
    p.vy += p.gravity * dt;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    // Wobble (reduced if prefers-reduced-motion)
    if (!state.reduceMotion) {
      p.x += Math.sin(p.age * 0.003) * 0.5;
    }

    // Growth
    p.radius *= p.growth;

    return true;
  });
}

// ============ CANVAS RENDERING ============
function drawScene() {
  const ctx = elements.canvas.getContext('2d');
  const w = state.canvasWidth;
  const h = state.canvasHeight;

  // Clear with gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(34, 24, 18, 0.3)');
  gradient.addColorStop(1, 'rgba(34, 24, 18, 0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Draw chalkboard backdrop (SVG-inspired)
  drawChalkboardBackdrop(ctx, w, h);

  // Draw pot/dish
  drawDish(ctx, w, h);

  // Draw steam particles
  drawSteamParticles(ctx);

  // Draw hand zones (debug, optional)
  // drawDebugZones(ctx, w, h);
}

function drawChalkboardBackdrop(ctx, w, h) {
  // Wood grain effect
  ctx.fillStyle = 'rgba(34, 24, 18, 0.3)';
  ctx.fillRect(0, 0, w, h);

  // Chalk border (top)
  ctx.strokeStyle = 'rgba(255, 244, 214, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  // Menu tags (top)
  const tags = ['dish/01', 'chip/mint', 'special/chai'];
  tags.forEach((tag, i) => {
    const x = 50 + i * 150;
    const y = 50;
    ctx.save();
    ctx.font = 'bold 12px "IBM Plex Mono"';
    ctx.fillStyle = 'rgba(212, 154, 63, 0.6)';
    ctx.fillText(tag, x, y);
    ctx.restore();
  });

  // Chalk doodles (corners)
  drawChalkDoodles(ctx, w, h);
}

function drawChalkDoodles(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 244, 214, 0.1)';
  ctx.lineWidth = 1;
  ctx.font = '24px sans-serif';
  ctx.fillStyle = 'rgba(212, 154, 63, 0.2)';

  // Spoon, flame, chilli
  ctx.fillText('🥄', 30, h - 40);
  ctx.fillText('🔥', w - 60, 50);
  ctx.fillText('🌶', w - 40, h - 40);
  ctx.restore();
}

function drawDish(ctx, w, h) {
  const dish = DISH_DATA[state.currentDish];
  const centerX = w * 0.5;
  const centerY = h * 0.82;
  const dishRadius = 40;

  // Dish shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + 50, 60, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dish
  ctx.fillStyle = dish.color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, dishRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 244, 214, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dish highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(centerX - 15, centerY - 15, 15, 0, Math.PI * 2);
  ctx.fill();

  // Flame beneath
  drawFlame(ctx, centerX, centerY + 60);
}

function drawFlame(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = 'rgba(212, 154, 63, 0.6)';
  ctx.beginPath();
  ctx.moveTo(x - 10, y);
  ctx.quadraticCurveTo(x - 15, y - 20, x - 5, y - 30);
  ctx.quadraticCurveTo(x, y - 25, x + 5, y - 30);
  ctx.quadraticCurveTo(x + 15, y - 20, x + 10, y);
  ctx.fill();
  ctx.restore();
}

function drawSteamParticles(ctx) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighten';

  state.steamParticles.forEach(p => {
    const alpha = 1 - (p.age / p.lifetime);
    ctx.fillStyle = `rgba(232, 165, 75, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// ============ UI UPDATES ============
function updateMeter() {
  elements.steamGauge.style.width = `${state.meter}%`;
  elements.steamGauge.setAttribute('aria-valuenow', Math.round(state.meter));
}

function updateHint(text) {
  elements.hintLine.textContent = text;
}

function updatePassLabel() {
  elements.passLabel.textContent = `Pass ${Math.floor(state.serves / 3) + 1} of 3`;
}

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ============ TAB & RECEIPT ============
function showTab() {
  const receiptItems = document.getElementById('receiptItems');
  receiptItems.innerHTML = '';

  let total = 0;
  state.session.tab.forEach(item => {
    const row = document.createElement('div');
    row.className = 'receipt-item';
    const desc = `1x ${item.name}`;
    const price = `₹${item.price}`;
    row.innerHTML = `<span class="receipt-item-desc">${desc}</span><span class="receipt-item-price">${price}</span>`;
    receiptItems.appendChild(row);
    total += item.price;
  });

  document.getElementById('finalServes').textContent = state.serves;
  document.getElementById('receiptTotal').textContent = `<code>total ₹${total}</code>`;

  elements.tabDialog.showModal();
}

function resetSession() {
  state.serves = 0;
  state.meter = 0;
  state.currentDish = '01';
  state.currentChip = null;
  state.currentSpecial = null;
  state.session.tab = [];
  state.steamParticles = [];
  state.currentState = STATE.IDLE;
  elements.specialsLocked.classList.remove('hidden');
  elements.specialsList.classList.add('hidden');
  elements.dockPill.classList.remove('glow');
  elements.tabDialog.close();
  updateDockPill();
  elements.servesCount.textContent = '0';
  elements.dishName.textContent = DISH_DATA['01'].slug;
  showToast('New session started. Bon appétit!', 'success');
}

// ============ SHARE FUNCTIONALITY ============
function parseShareURL() {
  const params = new URLSearchParams(window.location.search);
  const dish = params.get('dish');
  const chip = params.get('chip');
  const special = params.get('special');

  if (dish) {
    // Find dish by slug
    for (const [id, data] of Object.entries(DISH_DATA)) {
      if (data.slug === dish) {
        state.currentDish = id;
        break;
      }
    }
  }

  if (chip) state.currentChip = chip;
  if (special) state.currentSpecial = special;

  if (dish || chip || special) {
    setTimeout(() => {
      updateMenuStatus();
      updateDockPill();
      const dishName = DISH_DATA[state.currentDish].name;
      let toastMsg = `Tonight: ${dishName}`;
      if (state.currentChip) toastMsg += ` · ${CHIP_DATA[state.currentChip].name}`;
      if (state.currentSpecial) toastMsg += ` · ${SPECIAL_DATA[state.currentSpecial].name}`;
      showToast(toastMsg, 'info');
    }, 500);
  }
}

function shareTab() {
  const dishSlug = DISH_DATA[state.currentDish].slug;
  const chipParam = state.currentChip ? `&chip=${state.currentChip}` : '';
  const specialParam = state.currentSpecial ? `&special=${state.currentSpecial}` : '';
  const url = `${window.location.origin}${window.location.pathname}?dish=${dishSlug}${chipParam}${specialParam}`;

  if (navigator.share) {
    navigator.share({
      title: 'The Midnight Kitchen',
      text: 'Share tonight\'s tab',
      url
    }).catch(err => console.log('Share cancelled:', err));
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      showToast('Tab URL copied to clipboard', 'success');
    });
  }
}

// ============ GAME LOOP ============
let lastFrameTime = performance.now();

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.016); // Cap at 60fps
  lastFrameTime = timestamp;

  if (state.kitchenOpen) {
    updateHandTracking();
    updateGameState();
    updateSteamParticles(dt);
    updatePassLabel();
  }

  drawScene();
  requestAnimationFrame(gameLoop);
}

// ============ START ============
init().catch(error => {
  console.error('Initialization error:', error);
  showToast('Failed to initialize. Check console.', 'info');
});
