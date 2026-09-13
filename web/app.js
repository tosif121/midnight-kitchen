import * as Vision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';

const { FaceLandmarker, HandLandmarker, PoseLandmarker } = Vision;

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
const METER_FILL_RATE = 0.006;
const MAX_PARTICLES = 220;

let state = {
  kitchenOpen: false,
  currentDish: '01',
  currentChip: null,
  currentSpecial: null,
  serves: 0,
  meter: 0,
  steamParticles: [],
  allHands: [],
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
  swayUntil: 0,
  reduceMotion: false,
  passLevelReached: 0,
  session: {
    tab: []
  }
};

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
  closeKitchenButton: null,
  cancelMenuButton: null,
  applyMenuButton: null,
  shareMenuButton: null,
  specialsLocked: null,
  specialsList: null,
  menuStatus: null
};

let handLandmarker;
let runningMode = 'VIDEO';
let cpuFallbackShown = false;

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
    console.log('HandLandmarker initialized with GPU');
    return true;
  } catch (error) {
    console.warn('GPU delegate failed, trying CPU:', error);
    try {
      const vision = await Vision;
      handLandmarker = await vision.HandLandmarker.createFromOptions(
        vision,
        {
          baseOptions: {
            modelAssetPath: '/models/hand_landmarker.task',
            delegate: 'CPU'
          },
          runningMode,
          numHands: 2
        }
      );
      if (!cpuFallbackShown) {
        showToast('Switched to CPU hand tracking (slower but works)', 'info');
        cpuFallbackShown = true;
      }
      console.log('HandLandmarker initialized with CPU');
      return true;
    } catch (cpuError) {
      console.error('Failed to initialize HandLandmarker:', cpuError);
      showToast('Hand tracking unavailable. Model file missing.', 'info');
      return false;
    }
  }
}

async function init() {
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
  elements.closeKitchenButton = document.getElementById('closeKitchenButton');
  elements.cancelMenuButton = document.getElementById('cancelMenuButton');
  elements.applyMenuButton = document.getElementById('applyMenuButton');
  elements.shareMenuButton = document.getElementById('shareMenuButton');
  elements.specialsLocked = document.getElementById('specialsLocked');
  elements.specialsList = document.getElementById('specialsList');
  elements.menuStatus = document.getElementById('menuStatus');

  state.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

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

  await initHandLandmarker();

  setupEventListeners();

  parseShareURL();

  elements.openDialog.showModal();

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
  elements.closeKitchenButton.addEventListener('click', openTabAndConfirm);
  elements.cancelMenuButton.addEventListener('click', closeMenu);
  elements.applyMenuButton.addEventListener('click', applyMenuAndClose);
  elements.payCloseButton.addEventListener('click', resetSession);
  elements.shareMenuButton.addEventListener('click', shareTab);

  document.querySelectorAll('.menu-plate').forEach(btn => {
    btn.addEventListener('click', () => selectDish(btn.dataset.id));
  });

  document.querySelectorAll('.menu-chip').forEach(btn => {
    btn.addEventListener('click', () => selectChip(btn.dataset.id));
  });

  document.querySelectorAll('.menu-special-item').forEach(btn => {
    btn.addEventListener('click', () => selectSpecial(btn.dataset.id));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (elements.menuDialog.open) {
        closeMenu();
        elements.dockPill.focus();
      }
      if (elements.tabDialog.open) {
        elements.tabDialog.close();
        elements.closeKitchenButton.focus();
      }
    }
    if (e.key === 'c' || e.key === 'C') {
      if (state.kitchenOpen && !elements.menuDialog.open && !elements.tabDialog.open) {
        openTabAndConfirm();
      }
    }
  });
}

function openKitchen() {
  state.kitchenOpen = true;
  elements.openDialog.close();
  showToast('Welcome to the Midnight Kitchen', 'info');
  updatePassLabel();
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
  document.querySelectorAll('.menu-plate').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === state.currentDish);
  });

  document.querySelectorAll('.menu-chip').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.id === state.currentChip);
  });

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

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 232, g: 165, b: 75 };
}

function isHandOpen(landmarks) {
  if (!landmarks || landmarks.length < 21) return false;

  const getDistance = (a, b) => {
    const dx = landmarks[a].x - landmarks[b].x;
    const dy = landmarks[a].y - landmarks[b].y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const distances = [
    getDistance(8, 6),
    getDistance(12, 10),
    getDistance(16, 14),
    getDistance(20, 18)
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
    state.allHands = result.landmarks;
    state.handLandmarks = result.landmarks.length > 0 ? result.landmarks[0] : null;
  } catch (error) {
    console.error('Hand tracking error:', error);
  }
}

function updateGameState() {
  if (!state.kitchenOpen) return;

  const landmarks = state.handLandmarks;
  const now = performance.now();

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

  switch (state.currentState) {
    case STATE.IDLE:
      if (inPot && isOpen) {
        state.hoverStartTime = now;
        state.hoverStartPos = wrist;
        state.currentState = STATE.HOVERING;
        updateHint('Hold steady... building steam');
        if (state.passLevelReached < 1) {
          state.passLevelReached = 1;
        }
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
        if (state.passLevelReached < 2) {
          state.passLevelReached = 2;
        }
      }
      break;

    case STATE.CAPTURING:
      if (!inPot) {
        triggerRelease(wrist);
      } else {
        if (state.meter < 100) {
          state.meter = Math.min(100, state.meter + METER_FILL_RATE);
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
    state.swayUntil = performance.now() + 1000;
  }

  state.meter = 0;
  updateMeter();
}

function checkServePose() {
  if (state.currentState === STATE.RELEASING) return;
  if (state.allHands.length < 2) return;

  const hand1 = state.allHands[0];
  const hand2 = state.allHands[1];

  if (!isHandOpen(hand1) || !isHandOpen(hand2)) return;

  const wrist1 = getWristPosition(hand1);
  const wrist2 = getWristPosition(hand2);

  if (!wrist1 || !wrist2) return;

  const xDiff = Math.abs(wrist1.x - wrist2.x);
  const yAvg = (wrist1.y + wrist2.y) / 2;

  if (xDiff > 0.12 || yAvg < 0.65 || yAvg > 0.9) {
    state.servePoseStartTime = 0;
    return;
  }

  if (state.servePoseStartTime === 0) {
    state.servePoseStartTime = performance.now();
    updateHint('SERVED? Hold steady...');
  } else {
    const elapsed = performance.now() - state.servePoseStartTime;
    if (elapsed >= SERVE_POSE_HOLD_TIME) {
      state.servePoseArmed = true;
      const centerX = (wrist1.x + wrist2.x) / 2;
      const centerY = yAvg;
      createBrassBurst(centerX, centerY);
      showToast('SERVED! Next steam is doubled', 'success');
      state.servePoseStartTime = 0;
      updateHint('Palm to the pot for double steam!');
    }
  }
}

function createBrassBurst(x, y) {
  if (state.reduceMotion) return;
  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12;
    state.steamParticles.push({
      x: x * state.canvasWidth,
      y: y * state.canvasHeight,
      vx: Math.cos(angle) * 200,
      vy: Math.sin(angle) * 200,
      lifetime: 600,
      age: 0,
      radius: 8,
      r: 212,
      g: 154,
      b: 63,
      gravity: 100,
      drag: 0.85,
      growth: 1.02
    });
  }
}

function recordServe(isDouble = false) {
  const servesAdd = isDouble ? 2 : 1;
  state.serves += servesAdd;
  elements.servesCount.textContent = state.serves;
  elements.dishName.textContent = DISH_DATA[state.currentDish].slug;

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

  if (state.serves === 5) {
    unlockSpecials();
  }

  if (state.passLevelReached < 3) {
    state.passLevelReached = 3;
  }
}

function unlockSpecials() {
  elements.specialsLocked.classList.add('hidden');
  elements.specialsList.classList.remove('hidden');
  elements.dockPill.classList.add('glow');
  showToast('The lights are on — late menu\'s up.', 'info');
}

function createSteamRelease(position, isDouble = false) {
  const dish = DISH_DATA[state.currentDish];
  const steamConfig = { ...dish.steam };

  if (state.currentChip) {
    const chipMod = CHIP_DATA[state.currentChip].modifier;
    steamConfig.lift *= chipMod.liftMult;
    steamConfig.density *= chipMod.densityMult;
  }

  if (state.currentSpecial === 'butter-chicken') {
    steamConfig.density *= 1.25;
    steamConfig.tint = '#F2C14E';
  } else if (state.currentSpecial === 'loaded-fries') {
    for (let i = 0; i < 8; i++) {
      state.steamParticles.push(createParticle(position, { ...steamConfig, tint: '#D49A3F', radius: 6 }));
    }
  }

  const count = isDouble ? steamConfig.density * 2 : steamConfig.density;
  for (let i = 0; i < count; i++) {
    state.steamParticles.push(createParticle(position, steamConfig));
  }

  if (state.currentSpecial === 'chai-refill') {
    createPersistentWisp();
  }

  if (state.steamParticles.length > MAX_PARTICLES) {
    state.steamParticles = state.steamParticles.slice(-MAX_PARTICLES);
  }
}

function createPersistentWisp() {
  if (state.reduceMotion) return;
  const x = state.canvasWidth * 0.25;
  const y = state.canvasHeight * 0.9;
  for (let i = 0; i < 8; i++) {
    state.steamParticles.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 20,
      vy: -80 - Math.random() * 60,
      lifetime: 2500,
      age: 0,
      radius: 8,
      r: 232,
      g: 165,
      b: 75,
      gravity: -60,
      drag: 0.93,
      growth: 1.04
    });
  }
}

function createParticle(position, config) {
  const angle = Math.random() * Math.PI * 2;
  const jitter = config.jitter || 1;
  const rgb = hexToRgb(config.tint);
  return {
    x: position.x * state.canvasWidth + (Math.random() - 0.5) * 20 * jitter,
    y: position.y * state.canvasHeight + (Math.random() - 0.5) * 20 * jitter,
    vx: Math.cos(angle) * (Math.random() * 100 + 50),
    vy: -Math.random() * 200 - 100,
    lifetime: 2000 + Math.random() * 1000,
    age: 0,
    radius: config.radius || 12,
    r: rgb.r,
    g: rgb.g,
    b: rgb.b,
    gravity: -config.lift * 50,
    drag: config.drag,
    growth: config.growth
  };
}

function updateSteamParticles(dt) {
  state.steamParticles = state.steamParticles.filter(p => {
    p.age += dt;
    if (p.age >= p.lifetime) return false;

    p.vy += p.gravity * dt;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (!state.reduceMotion) {
      p.x += Math.sin(p.age * 0.003) * 0.5;
    }

    p.radius *= p.growth;

    return true;
  });
}

function drawScene() {
  const ctx = elements.canvas.getContext('2d');
  const w = state.canvasWidth;
  const h = state.canvasHeight;

  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, 'rgba(34, 24, 18, 0.3)');
  gradient.addColorStop(1, 'rgba(34, 24, 18, 0.8)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  drawChalkboardBackdrop(ctx, w, h);

  drawIdleWisp(ctx, w, h);

  drawDish(ctx, w, h);

  drawSteamParticles(ctx);
}

function drawChalkboardBackdrop(ctx, w, h) {
  ctx.fillStyle = 'rgba(34, 24, 18, 0.3)';
  ctx.fillRect(0, 0, w, h);

  drawWoodPlanks(ctx, w, h);

  ctx.strokeStyle = 'rgba(255, 244, 214, 0.15)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  drawMenuTags(ctx, w, h);

  drawChalkDoodles(ctx, w, h);
}

function drawWoodPlanks(ctx, w, h) {
  ctx.fillStyle = 'rgba(20, 10, 5, 0.15)';
  for (let i = 0; i < h; i += 40) {
    ctx.fillRect(0, i, w, 2);
  }
}

function drawMenuTags(ctx, w, h) {
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
}

function drawChalkDoodles(ctx, w, h) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 244, 214, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(212, 154, 63, 0.2)';

  drawSpoon(ctx, 30, h - 40);
  drawFlameSmall(ctx, w - 60, 50);
  drawChilli(ctx, w - 40, h - 40);
  drawSteamCurl(ctx, 40, 80);

  ctx.restore();
}

function drawSpoon(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 10, y + 15);
  ctx.stroke();
}

function drawFlameSmall(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.quadraticCurveTo(x - 5, y - 5, x - 2, y - 12);
  ctx.quadraticCurveTo(x + 2, y - 8, x + 2, y - 12);
  ctx.quadraticCurveTo(x + 5, y - 5, x, y + 10);
  ctx.fill();
}

function drawChilli(ctx, x, y) {
  ctx.beginPath();
  ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.moveTo(x, y - 6);
  ctx.lineTo(x - 2, y - 10);
  ctx.stroke();
}

function drawSteamCurl(ctx, x, y) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 8, y - 5, x + 5, y - 15);
  ctx.quadraticCurveTo(x - 3, y - 20, x - 8, y - 12);
  ctx.stroke();
}

function drawIdleWisp(ctx, w, h) {
  if (!state.kitchenOpen) return;

  const centerX = w * 0.5;
  const centerY = h * 0.82;

  const inPot = state.handLandmarks ? isInPotZone(getWristPosition(state.handLandmarks)) : false;

  if (inPot && (state.currentState === STATE.HOVERING || state.currentState === STATE.CAPTURING)) {
    ctx.fillStyle = 'rgba(232, 165, 75, 0.15)';
    ctx.beginPath();
    ctx.arc(centerX, centerY - 50, 30, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawDish(ctx, w, h) {
  const dish = DISH_DATA[state.currentDish];
  const centerX = w * 0.5;
  const centerY = h * 0.82;
  const dishRadius = 40;
  const now = performance.now();
  const swayAmount = (now < state.swayUntil && !state.reduceMotion) ?
    Math.sin((now - (state.swayUntil - 1000)) * 0.006) * 3 : 0;
  const dishX = centerX + swayAmount;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(dishX, centerY + 50, 60, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  const inPot = state.handLandmarks ? isInPotZone(getWristPosition(state.handLandmarks)) : false;
  const glowAlpha = (inPot && (state.currentState === STATE.HOVERING || state.currentState === STATE.CAPTURING)) ? 0.3 : 0.1;
  ctx.fillStyle = `rgba(212, 154, 63, ${glowAlpha})`;
  ctx.beginPath();
  ctx.arc(dishX, centerY, dishRadius + 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = dish.color;
  ctx.beginPath();
  ctx.arc(dishX, centerY, dishRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 244, 214, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(dishX - 15, centerY - 15, 15, 0, Math.PI * 2);
  ctx.fill();

  drawFlameEnhanced(ctx, dishX, centerY + 60, inPot && (state.currentState === STATE.HOVERING || state.currentState === STATE.CAPTURING));
}

function drawFlameEnhanced(ctx, x, y, active) {
  ctx.save();
  ctx.fillStyle = active ? 'rgba(212, 154, 63, 0.9)' : 'rgba(212, 154, 63, 0.6)';
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
    ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

function updateMeter() {
  elements.steamGauge.style.width = `${state.meter}%`;
  elements.steamGauge.setAttribute('aria-valuenow', Math.round(state.meter));
}

function updateHint(text) {
  elements.hintLine.textContent = text;
}

function updatePassLabel() {
  if (state.passLevelReached < 3) {
    elements.passLabel.textContent = `Pass ${state.passLevelReached} of 3`;
  } else {
    elements.passLabel.textContent = `Pass 3 of 3 (${state.serves} serves)`;
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function openTabAndConfirm() {
  showTab();
}

function showTab() {
  const receiptItems = document.getElementById('receiptItems');
  receiptItems.innerHTML = '';

  const grouped = {};
  state.session.tab.forEach(item => {
    const key = `${item.type}:${item.name}`;
    if (!grouped[key]) {
      grouped[key] = { ...item, qty: 0 };
    }
    grouped[key].qty += 1;
  });

  let total = 0;
  Object.values(grouped).forEach(item => {
    const row = document.createElement('div');
    row.className = 'receipt-item';
    const desc = `${item.qty}x ${item.name}`;
    const price = `₹${item.price * item.qty}`;
    row.innerHTML = `<span class="receipt-item-desc">${desc}</span><span class="receipt-item-price">${price}</span>`;
    receiptItems.appendChild(row);
    total += item.price * item.qty;
  });

  document.getElementById('finalServes').textContent = state.serves;
  const totalCodeEl = document.getElementById('receiptTotal');
  totalCodeEl.innerHTML = '';
  const codeEl = document.createElement('code');
  codeEl.textContent = `total ₹${total}`;
  totalCodeEl.appendChild(codeEl);

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
  state.passLevelReached = 0;
  state.servePoseArmed = false;
  elements.specialsLocked.classList.remove('hidden');
  elements.specialsList.classList.add('hidden');
  elements.dockPill.classList.remove('glow');
  elements.tabDialog.close();
  updateDockPill();
  elements.servesCount.textContent = '0';
  elements.dishName.textContent = DISH_DATA['01'].slug;
  updatePassLabel();
  showToast('New session started. Bon appétit!', 'success');
}

function parseShareURL() {
  const params = new URLSearchParams(window.location.search);
  const dish = params.get('dish');
  const chip = params.get('chip');
  const special = params.get('special');

  if (dish) {
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
    navigator.clipboard.writeText(url).then(() => {
      showToast('Tab URL copied to clipboard', 'success');
    });
  }
}

let lastFrameTime = performance.now();

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastFrameTime) / 1000, 0.016);
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

init().catch(error => {
  console.error('Initialization error:', error);
  showToast('Failed to initialize. Check console.', 'info');
});
