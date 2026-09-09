(() => {
  const STORAGE_KEY = 'unknown-world-tree-bubbles';
  const MAX_VISIBLE_BUBBLES = 24;
  const SUPABASE_URL = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const API_KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const authKey = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const cloudHeaders = (token, extra = {}) => ({ apikey: API_KEY, Authorization: `Bearer ${token || API_KEY}`, ...extra });
  const cloudSession = () => {
    try { return JSON.parse(localStorage.getItem(authKey) || 'null'); } catch { return null; }
  };
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

  async function loadCloudBubbles() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos?select=id,storage_path,description,created_at&location=eq.WORLD_TREE_BUBBLE&order=created_at.asc&limit=200`, { headers: cloudHeaders(cloudSession()?.access_token) });
    if (!response.ok) return null;
    const rows = await response.json();
    return rows.map(row => {
      try { return { ...JSON.parse(row.description), cloudId: row.id, cloudPath: row.storage_path }; } catch { return null; }
    }).filter(Boolean);
  }

  async function addCloudBubble(item) {
    const auth = cloudSession();
    if (!auth?.access_token || !auth?.user?.id) return null;
    const path = `tree-bubbles/${auth.user.id}/${item.id}.json`;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos`, {
      method: 'POST',
      headers: cloudHeaders(auth.access_token, { 'Content-Type': 'application/json', Prefer: 'return=representation' }),
      body: JSON.stringify({ storage_path: path, description: JSON.stringify(item), location: 'WORLD_TREE_BUBBLE', ratio: 1 })
    });
    if (!response.ok) return null;
    const rows = await response.json();
    return { ...item, cloudId: rows[0]?.id, cloudPath: path };
  }

  async function deleteCloudBubble(item) {
    const auth = cloudSession();
    if (!auth?.access_token || !item.cloudId) return false;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos?id=eq.${encodeURIComponent(item.cloudId)}`, { method: 'DELETE', headers: cloudHeaders(auth.access_token) });
    return response.ok;
  }

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
        setTimeout(() => onDelete(item, orbit), 220);
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

  async function openTree() {
    const view = create('section', 'world-tree-view');
    const back = create('button', 'world-tree-back', '← 返回世界总览');
    const scene = create('div', 'tree-bubble-scene');
    const composer = create('form', 'tree-bubble-composer');
    const input = create('input');
    const add = create('button', '', '生成气泡');
    input.type = 'text';
    input.maxLength = 80;
    input.placeholder = '写下一句话…';
    input.setAttribute('aria-label', '输入气泡文字');
    add.type = 'submit';
    composer.append(input, add);
    back.onclick = () => close(view);
    view.append(back, scene, composer);
    document.body.append(view);

    let bubbles = [];
    const removeBubble = async (item, element) => {
      if (item.cloudId && !(await deleteCloudBubble(item))) {
        element.querySelector('.tree-bubble')?.classList.remove('is-removing');
        alert('云端删除失败，请确认已经登录后重试。');
        return;
      }
      bubbles = bubbles.filter(entry => entry.id !== item.id);
      saveBubbles(bubbles.filter(entry => !entry.cloudId));
      element.remove();
    };
    const render = item => scene.append(bubbleElement(item, removeBubble));
    const renderAll = () => {
      scene.replaceChildren();
      bubbles.slice(-MAX_VISIBLE_BUBBLES).forEach(render);
    };
    const localBubbles = readBubbles();
    const cloudBubbles = await loadCloudBubbles();
    if (cloudBubbles) {
      bubbles = cloudBubbles;
      const remainingLocal = [];
      for (const local of localBubbles) {
        const uploaded = await addCloudBubble(local);
        if (uploaded) bubbles.push(uploaded);
        else remainingLocal.push(local);
      }
      if (localBubbles.length) saveBubbles(remainingLocal);
      bubbles.push(...remainingLocal);
    } else {
      bubbles = localBubbles;
    }
    renderAll();
    composer.onsubmit = async event => {
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
      add.disabled = true;
      add.textContent = '同步中…';
      const uploaded = await addCloudBubble(item);
      add.disabled = false;
      add.textContent = '生成气泡';
      if (!uploaded) {
        alert('请先在“回忆灯塔”登录云端账号，再生成气泡。');
        return;
      }
      bubbles.push(uploaded);
      renderAll();
      input.value = '';
      input.focus();
    };
    const refresh = async () => {
      if (!view.isConnected) return;
      if (!cloudSession()?.access_token) { setTimeout(refresh, 12000); return; }
      const latest = await loadCloudBubbles();
      if (latest && JSON.stringify(latest.map(item => item.cloudId)) !== JSON.stringify(bubbles.map(item => item.cloudId))) {
        bubbles = latest;
        renderAll();
      }
      setTimeout(refresh, 12000);
    };
    setTimeout(refresh, 12000);
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
