// Sound effects for the game screen, played through the Web Audio API. The clips (credited in
// CREDITS.md) are fetched and decoded once sound is first unlocked: phones play nothing until
// the player has tapped, so unlockSound is called on the first tap. Whether sound is on is
// remembered on this device.

const ON_KEY = "mech-attack.sound";

// Each clip's measured loudness (LUFS, from ffmpeg's ebur128 filter, 29 October 2026). Clips
// are played at the gain that brings them all to TARGET_LUFS, so they sound evenly loud
// without re-editing the files.
const TARGET_LUFS = -19;
const DECIBELS_PER_GAIN_DECADE = 20;
// A clip cut short fades out over this long, so it does not click.
const FADE_S = 0.15;
const MS_PER_S = 1000;
export const SOUNDS = {
  tankMoving: { file: "audio/tank-moving.mp3", lufs: -26.0 },
  flying: { file: "audio/helicopter.mp3", lufs: -24.4 },
  infantryFiring: { file: "audio/infantry-firing.mp3", lufs: -21.5 },
  tankFiring: { file: "audio/tank-firing.mp3", lufs: -21.5 },
  capture: { file: "audio/capture-beep.mp3", lufs: -18.5 },
  footsteps: { file: "audio/footsteps.mp3", lufs: -21.3 },
  // Measured 30 October 2026.
  sonicBoom: { file: "audio/sonic-boom.mp3", lufs: -18.4 },
  harvest: { file: "audio/harvest.mp3", lufs: -21.5 },
};

let context = null;
const buffers = {};
let on = loadSetting();

function loadSetting() {
  try {
    return localStorage.getItem(ON_KEY) !== "off";
  } catch {
    return true;
  }
}

export function soundOn() {
  return on;
}

export function setSoundOn(value) {
  on = value;
  try {
    localStorage.setItem(ON_KEY, value ? "on" : "off");
  } catch {
    // Not remembered; the setting still applies until the page is closed.
  }
  if (on) unlockSound();
}

// Starts the audio engine and loads the clips. Call from a tap or click.
export function unlockSound() {
  if (!on || typeof AudioContext === "undefined") return;
  if (!context) {
    context = new AudioContext();
    for (const name in SOUNDS) load(name);
  }
  if (context.state === "suspended") context.resume();
}

async function load(name) {
  try {
    const response = await fetch(SOUNDS[name].file);
    buffers[name] = await context.decodeAudioData(await response.arrayBuffer());
  } catch {
    // A clip that fails to load is simply silent.
  }
}

// Plays a clip once. volume scales it further (1 = the clip's even level). ms, if given, cuts
// it short: it fades out and stops that long after it starts (a move that has finished).
export function playSound(name, volume = 1, ms = null) {
  if (!on || !context || !buffers[name]) return;
  const source = context.createBufferSource();
  source.buffer = buffers[name];
  const gain = context.createGain();
  const level = 10 ** ((TARGET_LUFS - SOUNDS[name].lufs) / DECIBELS_PER_GAIN_DECADE);
  gain.gain.value = level * volume;
  source.connect(gain).connect(context.destination);
  source.start();
  if (ms !== null) {
    const end = context.currentTime + ms / MS_PER_S;
    gain.gain.setValueAtTime(level * volume, Math.max(context.currentTime, end - FADE_S));
    gain.gain.linearRampToValueAtTime(0, end);
    source.stop(end);
  }
}
