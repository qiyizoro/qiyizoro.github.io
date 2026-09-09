(() => {
  const STORAGE_KEY = 'unknown-world-tree-bubbles';
  const palette = ['gold', 'amber', 'moon', 'sage', 'pearl'];
  const create = (tag, cls, text) => {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text) el.textContent = text;
    return el;
  };
  const close = el => el?.remove();
  const readBubbles = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  };
  const saveBubbles = bubbles => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bubbles)); } catch {}
  };

  function bubbleElement(item, onDelete) {
    const orbit = create('div', 'tree-bubble-orbit');
    const bubble = create('button', `tree-bubble tree-bubble--${item.tone}`);
    bubble.type = 'button';
    bubble.setAttribute('aria-label', '点击查看文字，长按删除');
    bubble.innerHTML = `<span class="tree-bubble__glow"></span><span class="tree-bubble__text"></span>`;
    bubble.querySelector('.tree-bubble__text').textContent = item.text;
    orbit.style.setProperty('--orbit-y', `${item.y}%`);
    orbit.style.setProperty('--orbit-size', `${item.size}px`);
    orbit.style.setProperty('--orbit-duration', `${item.duration}s`);
    orbit.style.setProperty('--orbit-delay', `${item.delay}s`);
    orbit.style.setProperty('--orbit-depth', item.depth);
    let timer;
    let longPressed = false;
    const cancel = () => clearTimeout(timer);
    bubble.addEventListener('pointerdown', () => {
      longPressed = false;
      timer = setTimeout(() => {
        longPressed = true;
        bubble.classList.add('is-removing');
        setTimeout(() => onDelete(item.id, orbit), 220);
      }, 720);
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => bubble.addEventListener(type, cancel));
    bubble.addEventListener('click', event => {
      if (longPressed) { event.preventDefault(); return; }
      bubble.classList.toggle('is-open');
      bubble.setAttribute('aria-expanded', String(bubble.classList.contains('is-open')));
    });
    orbit.append(bubble);
    return orbit;
  }

  function openTree() {
    const view = create('section', 'world-tree-view');
    const back = create('button', 'world-tree-back', '← 返回世界总览');
    const scene = create('div', 'tree-bubble-scene');
    const composer = create('form', 'tree-bubble-composer');
    const input = create('input');
    const add = create('button', '', '生成气泡');
    const hint = create('small', 'tree-bubble-hint', '点击气泡查看 · 长按删除');
    input.type = 'text';
    input.maxLength = 80;
    input.placeholder = '写下一句话…';
    input.setAttribute('aria-label', '输入气泡文字');
    add.type = 'submit';
    composer.append(input, add, hint);
    back.onclick = () => close(view);

    let bubbles = readBubbles();
    const removeBubble = (id, element) => {
      bubbles = bubbles.filter(item => item.id !== id);
      saveBubbles(bubbles);
      element.remove();
    };
    const render = item => scene.append(bubbleElement(item, removeBubble));
    bubbles.forEach(render);
    composer.onsubmit = event => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) { input.focus(); return; }
      const item = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text,
        tone: palette[Math.floor(Math.random() * palette.length)],
        y: 18 + Math.random() * 59,
        size: 48 + Math.round(Math.random() * 32),
        duration: 22 + Math.round(Math.random() * 18),
        delay: -Math.round(Math.random() * 24),
        depth: (0.72 + Math.random() * 0.7).toFixed(2)
      };
      bubbles.push(item);
      saveBubbles(bubbles);
      render(item);
      input.value = '';
      input.focus();
    };
    view.append(back, scene, composer);
    document.body.append(view);
  }

  function openLock() {
    if (document.querySelector('.world-tree-lock')) return;
    const layer = create('div', 'world-tree-lock');
    const box = create('section', 'world-tree-dialog');
    const x = create('button', 'world-tree-close', '×');
    const label = create('small', '', 'PROTECTED WORLD · 04');
    const title = create('h2', '', '进入世界树');
    const desc = create('p', '', '输入密码，唤醒这棵只属于你们的树。');
    const input = create('input');
    const button = create('button', '', '确认进入');
    const error = create('em');
    input.type = 'password';
    input.inputMode = 'numeric';
    input.maxLength = 4;
    input.placeholder = '四位密码';
    x.onclick = () => close(layer);
    layer.onclick = event => { if (event.target === layer) close(layer); };
    const submit = () => {
      if (input.value === '0520') { close(layer); openTree(); }
      else { error.textContent = '密码不正确，请再试一次。'; input.select(); }
    };
    button.onclick = submit;
    input.onkeydown = event => { if (event.key === 'Enter') submit(); };
    box.append(x, label, title, desc, input, button, error);
    layer.append(box);
    document.body.append(layer);
    input.focus();
  }

  function mount() {
    const row = document.querySelector('.world-accordion');
    if (!row || row.querySelector('.panel-4')) return;
    const panel = create('button', 'world-panel panel-4');
    panel.type = 'button';
    panel.innerHTML = '<div class="world-panel__art"></div><div class="world-panel__top"><b>04</b><i>✦</i></div><div class="world-panel__copy"><strong>世界树</strong><small>秘密花园 · 共同生长</small></div><span class="world-panel__arrow">→</span>';
    const activate = () => {
      row.querySelectorAll('.world-panel').forEach(item => item.classList.remove('is-active'));
      panel.classList.add('is-active');
    };
    panel.addEventListener('mouseenter', activate);
    panel.addEventListener('focus', activate);
    panel.onclick = openLock;
    row.append(panel);
  }
  new MutationObserver(mount).observe(document.documentElement, { childList: true, subtree: true });
  mount();
})();
