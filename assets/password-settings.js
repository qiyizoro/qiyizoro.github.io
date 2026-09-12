(() => {
  const SUPABASE_URL = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const API_KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const AUTH_KEY = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const LOCAL_KEY = 'unknown-world-passwords-v1';
  const PENDING_KEY = 'unknown-world-passwords-pending-v1';
  const UNLOCK_KEY = 'password-settings-unlocked-until';
  const ATTEMPTS_KEY = 'password-settings-attempts-v1';
  const DEFAULTS = { 'settings-admin': '7171', 'world-tree': '0520', 'secret-room': '0520', 'photo-manager': '5555' };
  const AREAS = [
    ['settings-admin', '设置管理', '进入本密码设置时使用'],
    ['world-tree', '世界树', '进入世界树时使用'],
    ['secret-room', '秘密房间', '进入私密空间时使用'],
    ['photo-manager', '照片管理', '长按删除星环照片时使用']
  ];
  const read = () => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}') }; } catch { return { ...DEFAULTS }; } };
  const write = value => localStorage.setItem(LOCAL_KEY, JSON.stringify({ ...DEFAULTS, ...value }));
  const session = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; } };
  const headers = extra => ({ apikey: API_KEY, Authorization: `Bearer ${session()?.access_token || API_KEY}`, ...(extra || {}) });
  const get = key => read()[key] || DEFAULTS[key] || '';
  async function loadCloud() {
    if (!session()?.access_token) return read();
    if (localStorage.getItem(PENDING_KEY) === '1') {
      const local = read(); await saveCloud(local); return local;
    }
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/site_data?select=value&key=eq.password-settings&limit=1`, { headers: headers() });
      const rows = response.ok ? await response.json() : [];
      if (rows[0]?.value && typeof rows[0].value === 'object') write(rows[0].value);
    } catch {}
    return read();
  }
  async function saveCloud(value) {
    write(value);
    if (!session()?.access_token) { localStorage.setItem(PENDING_KEY, '1'); return false; }
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/site_data?on_conflict=key`, { method: 'POST', headers: headers({ 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }), body: JSON.stringify({ key: 'password-settings', value: { ...DEFAULTS, ...value }, updated_at: new Date().toISOString() }) });
      if (response.ok) localStorage.removeItem(PENDING_KEY); else localStorage.setItem(PENDING_KEY, '1');
      return response.ok;
    } catch { localStorage.setItem(PENDING_KEY, '1'); return false; }
  }
  globalThis.WorldPasswords = { get, loadCloud, saveCloud };
  const makeLayer = html => {
    const layer = document.createElement('div'); layer.className = 'password-center-layer'; layer.innerHTML = html;
    layer.onclick = event => { if (event.target === layer) layer.remove(); };
    layer.querySelector('.password-center-close')?.addEventListener('click', () => layer.remove());
    document.body.append(layer); return layer;
  };
  function openCenter() {
    const values = read();
    const layer = makeLayer(`<section class="password-center" role="dialog" aria-modal="true"><button class="password-center-close" aria-label="关闭">×</button><p class="password-center-kicker">ACCESS CONTROL</p><h2>密码设置</h2><p class="password-center-intro">统一管理需要密码的区域。修改会先保存在本机，并在已连接云端时同步。</p><div class="password-center-list">${AREAS.map(([key,name,hint]) => `<label><span><b>${name}</b><small>${hint}</small></span><span class="password-field"><input type="password" inputmode="numeric" maxlength="4" data-key="${key}" value="${values[key]}"><button type="button" class="password-reveal">显示</button></span></label>`).join('')}</div><p class="password-center-status" aria-live="polite"></p><button class="password-center-save">保存并同步</button></section>`);
    layer.querySelectorAll('.password-reveal').forEach(button => button.onclick = () => { const input = button.previousElementSibling; input.type = input.type === 'password' ? 'text' : 'password'; button.textContent = input.type === 'password' ? '显示' : '隐藏'; });
    layer.querySelector('.password-center-save').onclick = async event => {
      const status = layer.querySelector('.password-center-status'); const next = {};
      for (const input of layer.querySelectorAll('[data-key]')) { const value = input.value.trim(); if (!/^\d{4}$/.test(value)) { input.focus(); status.textContent = '密码需为四位数字。'; return; } next[input.dataset.key] = value; }
      event.currentTarget.disabled = true; status.textContent = '正在保存…'; const synced = await saveCloud(next);
      status.textContent = synced ? '已保存，并同步到云端。' : '已保存到本机；登录云端后再次保存即可同步。'; event.currentTarget.disabled = false;
      if (next['settings-admin'] !== values['settings-admin']) sessionStorage.removeItem(UNLOCK_KEY);
    };
  }
  const cloudReady = loadCloud();
  const readAttempts = () => { try { return JSON.parse(sessionStorage.getItem(ATTEMPTS_KEY) || '{"count":0,"lockedUntil":0}'); } catch { return { count: 0, lockedUntil: 0 }; } };
  const writeAttempts = value => sessionStorage.setItem(ATTEMPTS_KEY, JSON.stringify(value));
  async function openGate() {
    if (document.querySelector('.password-center-layer')) return;
    if (Number(sessionStorage.getItem(UNLOCK_KEY) || 0) > Date.now()) { await cloudReady; openCenter(); return; }
    const layer = makeLayer('<form class="password-gate" role="dialog" aria-modal="true"><button type="button" class="password-center-close" aria-label="关闭">×</button><p class="password-center-kicker">SETTINGS</p><h2>进入设置</h2><p>请输入管理密码</p><input type="password" inputmode="numeric" maxlength="4" autocomplete="current-password" placeholder="四位密码"><button class="password-center-save">确认进入</button><em aria-live="polite"></em></form>');
    const form = layer.querySelector('form');
    const updateLock = () => {
      const attempts = readAttempts(); const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 1000);
      form.querySelector('button[type="submit"]').disabled = remaining > 0;
      if (remaining > 0) form.querySelector('em').textContent = `尝试次数过多，请 ${remaining} 秒后再试。`;
      else if (/尝试次数过多/.test(form.querySelector('em').textContent)) form.querySelector('em').textContent = '';
      if (remaining > 0) setTimeout(() => { if (layer.isConnected) updateLock(); }, 1000);
      return remaining;
    };
    form.onsubmit = async event => {
      event.preventDefault(); if (updateLock() > 0) return;
      const submit = form.querySelector('button[type="submit"]'); submit.disabled = true; submit.textContent = '正在验证…';
      await cloudReady;
      if (form.querySelector('input').value !== get('settings-admin')) {
        const attempts = readAttempts(); attempts.count = (attempts.count || 0) + 1;
        if (attempts.count >= 5) { attempts.count = 0; attempts.lockedUntil = Date.now() + 30000; }
        writeAttempts(attempts); submit.textContent = '确认进入'; submit.disabled = false;
        form.querySelector('em').textContent = attempts.lockedUntil > Date.now() ? '尝试次数过多，请 30 秒后再试。' : `密码不正确，还可尝试 ${5 - attempts.count} 次。`;
        form.querySelector('input').select(); return;
      }
      writeAttempts({ count: 0, lockedUntil: 0 }); sessionStorage.setItem(UNLOCK_KEY, String(Date.now() + 10 * 60 * 1000));
      layer.remove(); openCenter();
    };
    updateLock(); setTimeout(() => form.querySelector('input').focus());
  }
  function enhanceHeader() {
    const header = document.querySelector('header'); if (!header || header.querySelector('.password-settings-button')) return;
    const button = document.createElement('button'); button.className = 'password-settings-button'; button.type = 'button'; button.title = '密码设置'; button.setAttribute('aria-label', '打开密码设置');
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm9 4-2.1-1.2.1-2.4-2.4-2.4-2.4.1L13 4h-2L9.8 6.1 7.4 6 5 8.4l.1 2.4L3 12v2l2.1 1.2-.1 2.4L7.4 20l2.4-.1L11 22h2l1.2-2.1 2.4.1 2.4-2.4-.1-2.4L21 14v-2Z"/></svg>'; button.onclick = openGate; header.append(button);
  }
  function enhanceSecretGate() {
    document.querySelectorAll('form').forEach(form => {
      if (form.dataset.passwordBridge || !/秘密房间/.test(form.closest('main')?.textContent || '')) return; form.dataset.passwordBridge = 'true';
      form.addEventListener('submit', event => { const input = form.querySelector('input'); if (!input || input.value === '0520' || input.value !== get('secret-room')) return; event.preventDefault(); event.stopImmediatePropagation(); const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set; setter?.call(input, '0520'); input.dispatchEvent(new Event('input', { bubbles: true })); requestAnimationFrame(() => form.requestSubmit()); }, true);
    });
  }
  const scan = () => { enhanceHeader(); enhanceSecretGate(); };
  addEventListener('online', async () => { if (localStorage.getItem(PENDING_KEY) === '1' && session()?.access_token) await saveCloud(read()); });
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true }); scan();
})();
