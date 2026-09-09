(() => {
  let queued = false;

  function polishTwinHub() {
    queued = false;
    const heading = [...document.querySelectorAll('.subhero h1')].find(item => item.textContent.trim() === '双生之境');
    if (!heading) return;

    const subhero = heading.closest('.subhero');
    const intro = subhero?.querySelector('p:not(.eyebrow)');
    if (intro) intro.textContent = '选择要进入的区域';

    const hub = document.querySelector('.twin-hub');
    if (!hub) return;
    hub.classList.add('twin-hub--illustrated');
    const names = ['yeye', 'qiqi', 'tasks', 'achievements'];
    [...hub.querySelectorAll('.twin-module')].forEach((card, index) => {
      if (!names[index]) return;
      card.classList.add(`twin-module--${names[index]}`);
      card.querySelector('.portrait-preview, .system-icon')?.setAttribute('aria-hidden', 'true');
    });
  }

  new MutationObserver(() => {
    if (!queued) { queued = true; requestAnimationFrame(polishTwinHub); }
  }).observe(document.documentElement, { childList: true, subtree: true });
  polishTwinHub();
})();
