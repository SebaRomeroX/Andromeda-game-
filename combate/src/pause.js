export function initPause() {
  const overlay = document.getElementById('pause-overlay');
  const resumeBtn = document.getElementById('pause-resume');

  resumeBtn.addEventListener('click', () => overlay.classList.add('hidden'));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      overlay.classList.add('hidden');
    }
  });
}

export function showPause() {
  document.getElementById('pause-overlay').classList.remove('hidden');
}
