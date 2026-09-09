(() => {
  function polishCopy() {
    document.querySelectorAll('.subhero').forEach(hero => {
      const title = hero.querySelector('h1');
      if (!title || !/回忆(档案馆|灯塔)/.test(title.textContent.trim())) return;
      hero.querySelector('.eyebrow')?.classList.add('lighthouse-hidden');
      title.textContent = '回忆灯塔内';
      const description = hero.querySelector('p:not(.eyebrow)');
      if (description) description.textContent = '时间停留在了此刻';
    });
    document.querySelector('.story-layout > aside')?.classList.add('lighthouse-hidden');
    document.querySelectorAll('.memory-cloud-status').forEach(item => item.classList.add('lighthouse-hidden'));
    document.querySelectorAll('.archive-secret').forEach(secret => {
      secret.querySelector('.secret-heading .eyebrow')?.classList.add('lighthouse-hidden');
      const title = secret.querySelector('.secret-heading h2');
      if (title) title.textContent = '灯塔地下室';
      secret.querySelector('form > p')?.classList.add('lighthouse-hidden');
    });
    document.querySelectorAll('.memory-masonry').forEach(masonry => {
      if (masonry.dataset.lighthouseMasonry) return;
      masonry.dataset.lighthouseMasonry = 'true';
      requestAnimationFrame(() => masonry.classList.add('is-ready'));
    });
    document.querySelectorAll('.memory-tile').forEach(tile => {
      if (tile.textContent.includes('WORLD_TREE_BUBBLE')) tile.classList.add('lighthouse-hidden');
    });
  }

  function openLightbox(tile) {
    const source = tile.querySelector('img');
    if (!source) return;
    const layer = document.createElement('div');
    layer.className = 'memory-lightbox';
    const image = document.createElement('img');
    image.src = source.currentSrc || source.src;
    image.alt = source.alt || '回忆照片';
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'memory-lightbox__close';
    close.setAttribute('aria-label', '关闭大图');
    close.textContent = '×';
    const caption = tile.querySelector('.memory-tile__copy')?.cloneNode(true);
    layer.append(image);
    if (caption) layer.append(caption);
    layer.append(close);
    const escape = event => { if (event.key === 'Escape') dismiss(); };
    const dismiss = () => {
      layer.remove();
      removeEventListener('keydown', escape);
    };
    close.onclick = dismiss;
    layer.onclick = event => { if (event.target === layer) dismiss(); };
    addEventListener('keydown', escape);
    document.body.append(layer);
  }

  document.addEventListener('click', event => {
    if (event.target.closest('.memory-delete, .memory-add, .memory-editor')) return;
    const tile = event.target.closest('.memory-tile');
    if (tile) openLightbox(tile);
  });
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; polishCopy(); });
  };
  new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
  polishCopy();
})();
