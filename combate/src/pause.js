import { toggleMute, isMuted, setMusicVolume, getMusicVolume, setSfxVolume, getSfxVolume } from './music.js';

let overlay, muteBtn, musicSlider, sfxSlider;

function syncUI() {
  muteBtn.textContent = isMuted() ? '🔊 Reanudar sonido' : '🔇 Silenciar todo';
  musicSlider.value = Math.round(getMusicVolume() * 100);
  sfxSlider.value = Math.round(getSfxVolume() * 100);
}

export function initPause() {
  overlay = document.getElementById('pause-overlay');
  muteBtn = document.getElementById('pause-mute-all');
  musicSlider = document.getElementById('pause-music-vol');
  sfxSlider = document.getElementById('pause-sfx-vol');

  document.getElementById('pause-resume').addEventListener('click', () => overlay.classList.add('hidden'));

  muteBtn.addEventListener('click', () => {
    toggleMute();
    syncUI();
  });

  musicSlider.addEventListener('input', () => setMusicVolume(musicSlider.value / 100));
  sfxSlider.addEventListener('input', () => setSfxVolume(sfxSlider.value / 100));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
  });
}

export function showPause() {
  syncUI();
  overlay.classList.remove('hidden');
}
