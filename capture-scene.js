// The factory capture cutaway (Phil, 21 November 2026): a short full-screen scene shown when
// infantry overrun a factory. The infantryman cuts round the factory door with a welding torch,
// the door falls inwards with a clang, light floods out and his silhouette stands in the
// doorway. A placeholder built from simple shapes until Phil draws the layers; the sounds are
// made in code (Web Audio) until recorded clips are chosen. A tap skips it.
import { audioContext } from "./sound.js?v=0.88";

// Timeline, in ms from the start.
const FADE_MS = 250;
const CUT_START_MS = 300;
const CUT_END_MS = 1600;
const SHUDDER_END_MS = 1850;
const FALL_END_MS = 2250;
const WALK_START_MS = 2400;
const WALK_END_MS = 3000;
const CAPTION_MS = 2450;
const END_MS = 4100;
// The scene finishes this long after its end even if the page gets no frames (hidden).
const GRACE_MS = 500;
const MS_PER_S = 1000;

// The scene is drawn on a 400 by 300 board; everything below is in its units.
const VIEW_W = 400;
const VIEW_H = 300;
const GROUND_Y = 250;
const DOOR = { x: 155, y: 160, w: 90, h: 90 };
const DOOR_MID_X = DOOR.x + DOOR.w / 2;
// The welder stands this far to the left of his torch's tip, and walks to the doorway after.
const WELDER_OFFSET_X = 24;
const SHOULDER_DX = 3;
const SHOULDER_Y = GROUND_Y - 50;
const FOREARM = 16;
// How much smaller he looks standing in the doorway, further away.
const DOORWAY_SCALE = 0.9;
// The door's fall: how far it tips back (degrees), and the bounce when it lands.
const FALL_DEG = 86;
const BOUNCE_DEG = 78;
const SHUDDER_DEG = 3;
// Perspective of the door's fall, as a multiple of the stage's width.
const PERSPECTIVE = 1.4;

// Sparks from the torch: how many a frame, their speed (units a second), the pull of gravity
// (units a second squared), and how long each lasts (seconds).
const SPARKS_PER_FRAME = 5;
const SPARK_SPEED = [50, 170];
const GRAVITY = 320;
const SPARK_LIFE = [0.25, 0.7];
const SPARK_STREAK_S = 0.03;
const SPARK_WIDTH = 1.4;
// The torch's flare and the blue light it throws on the wall.
const FLARE_RADIUS = [8, 15];
const WALL_LIGHT_RADIUS = 130;
const WALL_LIGHT_ALPHA = 0.22;
// Dust when the door lands.
const DUST_COUNT = 34;
const DUST_SPEED = [15, 60];
const DUST_LIFE = 1.1;
const DUST_RADIUS = [3, 14];
const DUST_ALPHA = 0.5;

// Sounds made in code. The weld: noise through a band-pass whose level jumps at random every
// CRACKLE_STEP_S, over the arc's mains hum.
const MASTER_LEVEL = 0.6;
const WELD_BAND_HZ = 3800;
const WELD_Q = 0.9;
const WELD_LEVEL = 0.5;
const CRACKLE_STEP_S = 0.012;
const CRACKLE_MIN = 0.25;
const HUM_HZ = 100;
const HUM_CUTOFF_HZ = 700;
const HUM_LEVEL = 0.08;
// The door groaning as it gives: two close sawtooths sliding down.
const GROAN_HZ = [92, 96];
const GROAN_DROP = 0.75;
const GROAN_CUTOFF_HZ = 420;
const GROAN_LEVEL = 0.18;
// The clang: a struck steel plate as a few inharmonic tones ([ratio, seconds, level]), and a
// low thump under it.
const CLANG_HZ = 165;
const CLANG_MODES = [[1, 1.4, 0.32], [2.76, 0.9, 0.2], [5.4, 0.5, 0.12], [8.93, 0.3, 0.07]];
const THUMP_CUTOFF_HZ = 180;
const THUMP_S = 0.3;
const THUMP_LEVEL = 0.9;
const SILENT = 0.0001;
const ENVELOPE_S = 0.02;

const rand = ([low, high]) => low + Math.random() * (high - low);

// A standing infantryman, feet at (0, 0), facing right: helmet, backpack, body and legs.
const FIGURE = `
  <circle cx="0" cy="-60" r="8.5"/>
  <rect x="-10" y="-63" width="21" height="4.5" rx="2"/>
  <rect x="-12.5" y="-49" width="7" height="19" rx="2"/>
  <path d="M-6 -51 h12 l2.5 25 h-3.5 l1 26 h-6.5 l-2 -20 l-2 20 h-6.5 l1 -26 h-3.5 z"/>`;

function sceneMarkup(colour) {
  const { x, y, w, h } = DOOR;
  const rivets = [];
  for (let rx = 50; rx <= 350; rx += 30) {
    rivets.push(`<circle cx="${rx}" cy="58" r="2"/>`, `<circle cx="${rx}" cy="238" r="2"/>`);
  }
  const stripes = [];
  for (let sx = x - 20; sx < x + w + 20; sx += 14) {
    stripes.push(`<path d="M${sx} 150 h7 l-6 8 h-7 z"/>`);
  }
  return `
  <div class="cs-stage">
    <svg class="cs-layer" viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-hidden="true">
      <defs>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#1c0906"/><stop offset="1" stop-color="#5a2416"/>
        </linearGradient>
        <linearGradient id="cs-spill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffd890" stop-opacity="0.85"/>
          <stop offset="1" stop-color="#ff9a40" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${VIEW_W}" height="${VIEW_H}" fill="url(#cs-sky)"/>
      <rect y="${GROUND_Y}" width="${VIEW_W}" height="${VIEW_H - GROUND_Y}" fill="#3a170f"/>
      <rect x="30" y="40" width="340" height="${GROUND_Y - 40}" fill="#4a3c37"/>
      <g stroke="#3a2e2a" stroke-width="2">
        <path d="M30 100 H370 M30 200 H370 M110 40 V250 M290 40 V250"/>
      </g>
      <g fill="#6d5c55">${rivets.join("")}</g>
      <rect x="${x - 22}" y="148" width="${w + 44}" height="12" fill="#1d1512"/>
      <g fill="#e0a526">${stripes.join("")}</g>
      <rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 8}" fill="#2a201d"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#080303"/>
      <polygon class="cs-spill" points="${x},${GROUND_Y} ${x + w},${GROUND_Y}
        ${x + w + 50},${VIEW_H} ${x - 50},${VIEW_H}" fill="url(#cs-spill)" opacity="0"/>
    </svg>
    <div class="cs-glow" style="${boxStyle(DOOR)}"></div>
    <div class="cs-door" style="${boxStyle(DOOR)}">
      <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">
        <rect width="${w}" height="${h}" fill="#7a6a62"/>
        <rect x="6" y="6" width="${w - 12}" height="${h - 12}" fill="#6a5a53"
          stroke="#8b7a72" stroke-width="2"/>
        <path d="M8 8 L${w - 8} ${h - 8} M${w - 8} 8 L8 ${h - 8}" stroke="#56473f"
          stroke-width="7"/>
        <rect x="6" y="${h - 16}" width="${w - 12}" height="8" fill="#e0a526"/>
        <g fill="#9b8a82"><circle cx="10" cy="10" r="2"/><circle cx="${w - 10}" cy="10" r="2"/>
          <circle cx="10" cy="${h - 10}" r="2"/><circle cx="${w - 10}" cy="${h - 10}" r="2"/></g>
      </svg>
    </div>
    <svg class="cs-layer" viewBox="0 0 ${VIEW_W} ${VIEW_H}" aria-hidden="true">
      <defs>
        <filter id="cs-rim" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2"/>
        </filter>
      </defs>
      <path class="cs-cut" d="M${x} ${GROUND_Y} V${y} H${x + w} V${GROUND_Y}" fill="none"
        stroke="#ffb347" stroke-width="2.5" stroke-linecap="round"/>
      <g class="cs-welder">
        <g class="cs-rim" fill="none" stroke="${colour}" stroke-width="3.5" filter="url(#cs-rim)"
          opacity="0">${FIGURE}</g>
        <g class="cs-body" fill="#241c1a" stroke="${colour}" stroke-width="1">${FIGURE}</g>
      </g>
      <line class="cs-arm" stroke="#241c1a" stroke-width="5.5" stroke-linecap="round"/>
      <line class="cs-torch" stroke="#9aa3a8" stroke-width="2" stroke-linecap="round"/>
    </svg>
    <canvas class="cs-sparks"></canvas>
  </div>
  <div class="cs-caption" hidden>
    <div class="cs-title"></div>
    <div class="cs-subtitle"></div>
  </div>
  <div class="cs-skip">Tap to skip</div>`;
}

function boxStyle({ x, y, w, h }) {
  const pct = (a, b) => `${(a / b) * 100}%`;
  return `left:${pct(x, VIEW_W)};top:${pct(y, VIEW_H)};width:${pct(w, VIEW_W)};` +
    `height:${pct(h, VIEW_H)}`;
}

// ---------------------------------------------------------------------------------------
// Sounds made in code

function noise(context, seconds) {
  const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * seconds),
    context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = context.createBufferSource();
  source.buffer = buffer;
  return source;
}

function envelope(context, gain, start, seconds, level) {
  gain.gain.setValueAtTime(SILENT, context.currentTime);
  gain.gain.setValueAtTime(SILENT, start);
  gain.gain.exponentialRampToValueAtTime(level, start + ENVELOPE_S);
  gain.gain.setValueAtTime(level, start + seconds - ENVELOPE_S);
  gain.gain.exponentialRampToValueAtTime(SILENT, start + seconds);
}

function weld(context, out, start, seconds) {
  const hiss = noise(context, seconds);
  const band = context.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = WELD_BAND_HZ;
  band.Q.value = WELD_Q;
  const crackle = context.createGain();
  crackle.gain.setValueAtTime(0, context.currentTime);
  for (let t = 0; t < seconds; t += CRACKLE_STEP_S) {
    const level = WELD_LEVEL * (CRACKLE_MIN + (1 - CRACKLE_MIN) * Math.random() ** 2);
    crackle.gain.setValueAtTime(level, start + t);
  }
  crackle.gain.setValueAtTime(0, start + seconds);
  hiss.connect(band).connect(crackle).connect(out);
  hiss.start(start);
  hiss.stop(start + seconds);

  const hum = context.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = HUM_HZ;
  const low = context.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = HUM_CUTOFF_HZ;
  const level = context.createGain();
  envelope(context, level, start, seconds, HUM_LEVEL);
  hum.connect(low).connect(level).connect(out);
  hum.start(start);
  hum.stop(start + seconds);
}

function groan(context, out, start, seconds) {
  const low = context.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = GROAN_CUTOFF_HZ;
  const level = context.createGain();
  envelope(context, level, start, seconds, GROAN_LEVEL);
  low.connect(level).connect(out);
  for (const hz of GROAN_HZ) {
    const tone = context.createOscillator();
    tone.type = "sawtooth";
    tone.frequency.setValueAtTime(hz, start);
    tone.frequency.linearRampToValueAtTime(hz * GROAN_DROP, start + seconds);
    tone.connect(low);
    tone.start(start);
    tone.stop(start + seconds);
  }
}

function clang(context, out, start) {
  for (const [ratio, seconds, level] of CLANG_MODES) {
    const tone = context.createOscillator();
    tone.frequency.value = CLANG_HZ * ratio;
    const gain = context.createGain();
    gain.gain.setValueAtTime(SILENT, context.currentTime);
    gain.gain.setValueAtTime(level, start);
    gain.gain.exponentialRampToValueAtTime(SILENT, start + seconds);
    tone.connect(gain).connect(out);
    tone.start(start);
    tone.stop(start + seconds);
  }
  const thump = noise(context, THUMP_S);
  const low = context.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.value = THUMP_CUTOFF_HZ;
  const gain = context.createGain();
  gain.gain.setValueAtTime(SILENT, context.currentTime);
  gain.gain.setValueAtTime(THUMP_LEVEL, start);
  gain.gain.exponentialRampToValueAtTime(SILENT, start + THUMP_S);
  thump.connect(low).connect(gain).connect(out);
  thump.start(start);
}

// Schedules the scene's sounds; returns a function that silences them (on a skip).
function playSounds() {
  const context = audioContext();
  if (!context) return () => {};
  const master = context.createGain();
  master.gain.value = MASTER_LEVEL;
  master.connect(context.destination);
  const at = (ms) => context.currentTime + ms / MS_PER_S;
  weld(context, master, at(CUT_START_MS), (CUT_END_MS - CUT_START_MS) / MS_PER_S);
  groan(context, master, at(CUT_END_MS), (FALL_END_MS - CUT_END_MS) / MS_PER_S);
  clang(context, master, at(FALL_END_MS));
  return () => {
    master.gain.setTargetAtTime(0, context.currentTime, ENVELOPE_S);
    setTimeout(() => master.disconnect(), FADE_MS);
  };
}

// ---------------------------------------------------------------------------------------
// The scene

// Plays the cutaway over the whole screen. colour: the capturing side's colour; title and
// subtitle: the caption. Resolves once it is over or skipped.
export function playCaptureScene({ colour, title, subtitle }) {
  if (document.hidden) return Promise.resolve();
  const overlay = document.createElement("div");
  overlay.className = "capture-scene";
  overlay.setAttribute("role", "img");
  overlay.setAttribute("aria-label", `${title}. ${subtitle}`);
  overlay.innerHTML = sceneMarkup(colour);
  document.body.appendChild(overlay);
  const $ = (selector) => overlay.querySelector(selector);
  const stage = $(".cs-stage");
  const door = $(".cs-door");
  const cut = $(".cs-cut");
  const welder = $(".cs-welder");
  const rim = $(".cs-rim");
  const arm = $(".cs-arm");
  const torch = $(".cs-torch");
  const canvas = $(".cs-sparks");
  const draw = canvas.getContext("2d");
  $(".cs-title").textContent = title;
  $(".cs-subtitle").textContent = subtitle;
  $(".cs-caption").style.color = colour;

  // The canvas matches the stage in screen pixels, and draws in scene units.
  const fit = () => {
    const box = stage.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    stage.style.perspective = `${box.width * PERSPECTIVE}px`;
  };
  fit();
  const cutLength = cut.getTotalLength();
  cut.style.strokeDasharray = `${cutLength}`;
  cut.style.strokeDashoffset = `${cutLength}`;

  // Each change holds its first look until it starts and its last look after, except where a
  // later change to the same thing would hide an earlier one ("forwards" only).
  const timing = (from, to, easing = "linear", fill = "both") =>
    ({ delay: from, duration: to - from, easing, fill });
  overlay.animate([{ opacity: 0 }, { opacity: 1 }], timing(0, FADE_MS));
  door.animate([
    { transform: "rotateX(0deg)" },
    { transform: `rotateX(${SHUDDER_DEG}deg)`, offset: 0.2 },
    { transform: "rotateX(0deg)", offset: 0.4 },
    { transform: `rotateX(${SHUDDER_DEG * 2}deg)`, offset: 0.7 },
    { transform: "rotateX(0deg)" },
  ], timing(CUT_END_MS, SHUDDER_END_MS));
  door.animate([
    { transform: "rotateX(0deg)", easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
    { transform: `rotateX(${FALL_DEG}deg)`, offset: 0.8 },
    { transform: `rotateX(${BOUNCE_DEG}deg)`, offset: 0.9 },
    { transform: `rotateX(${FALL_DEG}deg)` },
  ], timing(SHUDDER_END_MS, FALL_END_MS, "linear", "forwards"));
  $(".cs-glow").animate([{ opacity: 0 }, { opacity: 1 }],
    timing(FALL_END_MS - FADE_MS, FALL_END_MS + FADE_MS, "ease-out"));
  $(".cs-spill").animate([{ opacity: 0 }, { opacity: 1 }],
    timing(FALL_END_MS - FADE_MS, FALL_END_MS + FADE_MS, "ease-out"));
  cut.animate([{ opacity: 1 }, { opacity: 0 }], timing(SHUDDER_END_MS, FALL_END_MS));
  rim.animate([{ opacity: 0 }, { opacity: 1 }], timing(FALL_END_MS, WALK_END_MS));
  $(".cs-body").animate([{ fill: "#241c1a" }, { fill: "#050202" }],
    timing(FALL_END_MS, WALK_END_MS));
  for (const part of [arm, torch]) {
    part.animate([{ opacity: 1 }, { opacity: 0 }], timing(SHUDDER_END_MS, FALL_END_MS));
  }
  setTimeout(() => {
    const caption = $(".cs-caption");
    caption.hidden = false;
    caption.animate([{ opacity: 0, transform: "translateY(8px)" }, { opacity: 1 }],
      { duration: FADE_MS * 2, easing: "ease-out" });
  }, CAPTION_MS);
  overlay.animate([{ opacity: 1 }, { opacity: 0 }],
    timing(END_MS - FADE_MS, END_MS, "linear", "forwards"));

  const silence = playSounds();
  const sparks = [];
  const dust = [];
  let dusted = false;
  let lastTip = null;
  let welderX = DOOR.x - WELDER_OFFSET_X;
  let last = performance.now();
  const start = last;

  const frame = (now) => {
    const t = now - start;
    const dt = Math.min(now - last, FADE_MS) / MS_PER_S;
    last = now;
    const cutting = t >= CUT_START_MS && t < CUT_END_MS;
    const progress = Math.min(1, Math.max(0, (t - CUT_START_MS) / (CUT_END_MS - CUT_START_MS)));
    const tip = cut.getPointAtLength(progress * cutLength);
    cut.style.strokeDashoffset = `${cutLength * (1 - progress)}`;

    // The welder follows his torch, then walks into the doorway.
    let scale = 1;
    if (t < WALK_START_MS) {
      welderX = tip.x - WELDER_OFFSET_X;
    } else {
      const walk = Math.min(1, (t - WALK_START_MS) / (WALK_END_MS - WALK_START_MS));
      const eased = walk * walk * (3 - 2 * walk);
      const from = DOOR.x + DOOR.w - WELDER_OFFSET_X;
      welderX = from + (DOOR_MID_X - from) * eased;
      scale = 1 + (DOORWAY_SCALE - 1) * eased;
    }
    welder.setAttribute("transform", `translate(${welderX} ${GROUND_Y}) scale(${scale})`);
    const shoulder = [welderX + SHOULDER_DX, SHOULDER_Y];
    const toTip = Math.hypot(tip.x - shoulder[0], tip.y - shoulder[1]) || 1;
    const hand = [shoulder[0] + ((tip.x - shoulder[0]) / toTip) * FOREARM,
      shoulder[1] + ((tip.y - shoulder[1]) / toTip) * FOREARM];
    setLine(arm, shoulder, hand);
    setLine(torch, hand, [tip.x, tip.y]);

    if (cutting) {
      for (let i = 0; i < SPARKS_PER_FRAME; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = rand(SPARK_SPEED);
        sparks.push({ x: tip.x, y: tip.y, vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - speed / 2, age: 0, life: rand(SPARK_LIFE) });
      }
    }
    if (t >= FALL_END_MS && !dusted) {
      dusted = true;
      for (let i = 0; i < DUST_COUNT; i++) {
        const x = DOOR.x + Math.random() * DOOR.w;
        const out = x < DOOR_MID_X ? -1 : 1;
        const speed = rand(DUST_SPEED);
        dust.push({ x, y: GROUND_Y, vx: out * speed, vy: -speed / 2, age: 0,
          r: rand(DUST_RADIUS) });
      }
    }
    lastTip = cutting ? tip : null;
    paint(draw, canvas, sparks, dust, lastTip, dt);
    if (t < END_MS && !finished) requestAnimationFrame(frame);
    else finish();
  };

  let finished = false;
  let resolveScene;
  const finish = () => {
    if (finished) return;
    finished = true;
    silence();
    overlay.remove();
    window.removeEventListener("resize", fit);
    resolveScene();
  };
  overlay.addEventListener("pointerdown", finish);
  window.addEventListener("resize", fit);
  // A page that is hidden gets no frames, and the game must not wait on them.
  setTimeout(finish, END_MS + GRACE_MS);
  requestAnimationFrame(frame);
  return new Promise((resolve) => {
    resolveScene = resolve;
  });
}

function setLine(line, [x1, y1], [x2, y2]) {
  line.setAttribute("x1", x1);
  line.setAttribute("y1", y1);
  line.setAttribute("x2", x2);
  line.setAttribute("y2", y2);
}

// Draws the sparks, the torch's flare and light, and the dust, moving each on by dt seconds.
function paint(draw, canvas, sparks, dust, tip, dt) {
  const unit = canvas.width / VIEW_W;
  draw.setTransform(1, 0, 0, 1, 0, 0);
  draw.clearRect(0, 0, canvas.width, canvas.height);
  draw.setTransform(unit, 0, 0, unit, 0, 0);
  if (tip) {
    const light = draw.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, WALL_LIGHT_RADIUS);
    light.addColorStop(0, `rgba(170, 210, 255, ${WALL_LIGHT_ALPHA * (0.6 + Math.random())})`);
    light.addColorStop(1, "rgba(170, 210, 255, 0)");
    draw.fillStyle = light;
    draw.fillRect(0, 0, VIEW_W, VIEW_H);
    const radius = rand(FLARE_RADIUS);
    const flare = draw.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, radius);
    flare.addColorStop(0, "rgba(255, 255, 255, 1)");
    flare.addColorStop(0.3, "rgba(200, 230, 255, 0.9)");
    flare.addColorStop(1, "rgba(120, 170, 255, 0)");
    draw.fillStyle = flare;
    draw.fillRect(tip.x - radius, tip.y - radius, radius * 2, radius * 2);
  }
  draw.lineWidth = SPARK_WIDTH;
  draw.lineCap = "round";
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i];
    s.age += dt;
    if (s.age > s.life || s.y > GROUND_Y) {
      sparks.splice(i, 1);
      continue;
    }
    s.vy += GRAVITY * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    const heat = 1 - s.age / s.life;
    draw.strokeStyle = `rgba(255, ${Math.round(120 + 130 * heat)}, ${Math.round(60 * heat)}, ` +
      `${heat})`;
    draw.beginPath();
    draw.moveTo(s.x, s.y);
    draw.lineTo(s.x - s.vx * SPARK_STREAK_S, s.y - s.vy * SPARK_STREAK_S);
    draw.stroke();
  }
  for (let i = dust.length - 1; i >= 0; i--) {
    const d = dust[i];
    d.age += dt;
    if (d.age > DUST_LIFE) {
      dust.splice(i, 1);
      continue;
    }
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.vx *= 1 - dt;
    const fade = 1 - d.age / DUST_LIFE;
    draw.fillStyle = `rgba(150, 105, 85, ${DUST_ALPHA * fade})`;
    draw.beginPath();
    draw.arc(d.x, d.y, d.r * (1 + d.age), 0, Math.PI * 2);
    draw.fill();
  }
}
