const STORAGE_MUTED = 'andromeda-music-muted';
const STORAGE_MUSIC_VOL = 'andromeda-music-volume';
const STORAGE_SFX_VOL = 'andromeda-sfx-volume';

const TRACKS = {
  chill: [
    'assets/audio/chill/the-britons.mp3',
    'assets/audio/chill/wandering-knight.mp3'
  ],
  combat: [
    'assets/audio/combat/action-adventure-fantasy.mp3',
    'assets/audio/combat/cinematic-powerful-background.mp3',
    'assets/audio/combat/epic-rise.mp3'
  ]
};

const CROSSFADE_MS = 1500;
const DEFAULT_MUSIC_VOLUME = 0.3;
const DEFAULT_SFX_VOLUME = 0.5;

let musicVolume = parseFloat(localStorage.getItem(STORAGE_MUSIC_VOL));
if (isNaN(musicVolume)) musicVolume = DEFAULT_MUSIC_VOLUME;

let sfxVolume = parseFloat(localStorage.getItem(STORAGE_SFX_VOL));
if (isNaN(sfxVolume)) sfxVolume = DEFAULT_SFX_VOLUME;

const audioA = new Audio();
const audioB = new Audio();
audioA.preload = 'auto';
audioB.preload = 'auto';
audioA.loop = false;
audioB.loop = false;

let active = audioA;
let inactive = audioB;
let currentCategory = null;
let muted = localStorage.getItem(STORAGE_MUTED) === 'true';
let fadeTimer = null;

function pickRandom(category) {
  const list = TRACKS[category];
  return list[Math.floor(Math.random() * list.length)];
}

function applyMute(audio) {
  audio.muted = muted;
}

function crossfade(audio, durationMs) {
  const steps = 20;
  const stepMs = durationMs / steps;
  const targetVolume = muted ? 0 : musicVolume;
  let i = 0;

  clearInterval(fadeTimer);
  audio.volume = 0;
  applyMute(audio);
  audio.play().catch(() => {});

  fadeTimer = setInterval(() => {
    i++;
    audio.volume = (i / steps) * targetVolume;
    if (i >= steps) {
      clearInterval(fadeTimer);
      audio.volume = targetVolume;
    }
  }, stepMs);
}

function fadeOutAndSwap(category) {
  const duration = CROSSFADE_MS;
  const steps = 20;
  const stepMs = duration / steps;
  let i = 0;

  const oldVolume = active.volume;
  clearInterval(fadeTimer);

  fadeTimer = setInterval(() => {
    i++;
    active.volume = oldVolume * (1 - i / steps);
    if (i >= steps) {
      clearInterval(fadeTimer);
      active.pause();
      active.currentTime = 0;

      [active, inactive] = [inactive, active];
      currentCategory = category;
      active.src = pickRandom(category);
      crossfade(active, CROSSFADE_MS);
    }
  }, stepMs);
}

function startCategory(category) {
  if (currentCategory === category) return;

  if (active.paused && inactive.paused) {
    currentCategory = category;
    active.src = pickRandom(category);
    crossfade(active, CROSSFADE_MS);
  } else {
    fadeOutAndSwap(category);
  }
}

audioA.addEventListener('ended', () => {
  if (currentCategory) {
    active.src = pickRandom(currentCategory);
    crossfade(active, 200);
  }
});

audioB.addEventListener('ended', () => {
  if (currentCategory) {
    active.src = pickRandom(currentCategory);
    crossfade(active, 200);
  }
});

export function playChill() {
  startCategory('chill');
}

export function playCombat() {
  startCategory('combat');
}

export function stopMusic() {
  clearInterval(fadeTimer);
  currentCategory = null;
  active.pause();
  active.currentTime = 0;
  inactive.pause();
  inactive.currentTime = 0;
  active.volume = 0;
  inactive.volume = 0;
}

export function toggleMute() {
  muted = !muted;
  localStorage.setItem(STORAGE_MUTED, muted);
  active.volume = muted ? 0 : musicVolume;
  applyMute(active);
  return muted;
}

export function isMuted() {
  return muted;
}

export function setMusicVolume(percent) {
  musicVolume = Math.max(0, Math.min(1, percent));
  localStorage.setItem(STORAGE_MUSIC_VOL, musicVolume);
  if (!muted) active.volume = musicVolume;
}

export function getMusicVolume() {
  return musicVolume;
}

export function setSfxVolume(percent) {
  sfxVolume = Math.max(0, Math.min(1, percent));
  localStorage.setItem(STORAGE_SFX_VOL, sfxVolume);
}

export function getSfxVolume() {
  return sfxVolume;
}

const SOUND_NAMES = ['achievement', 'defeat', 'error', 'metal', 'pain', 'punch', 'slam', 'spell', 'swoosh'];
const SOUND_VOLUME_OVERRIDES = { swoosh: 0.7, slam: 0.7 };
const soundPool = {};

function ensureSoundPool() {
  if (Object.keys(soundPool).length) return;
  for (const name of SOUND_NAMES) {
    const a = new Audio(`assets/audio/sound/${name}.mp3`);
    a.preload = 'auto';
    soundPool[name] = a;
  }
}

export function playSound(name) {
  if (muted) return;
  ensureSoundPool();
  const a = soundPool[name];
  if (!a) return;
  a.volume = SOUND_VOLUME_OVERRIDES[name] ?? sfxVolume;
  a.currentTime = 0;
  a.play().catch(e => console.warn('[sound]', name, e));
}
