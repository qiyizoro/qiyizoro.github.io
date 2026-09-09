(() => {
  const API = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  const AUTH_KEY = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const PROFILE_LOCATION = 'YEYE_PROFILE';
  const MESSAGE_LOCATION = 'YEYE_MESSAGE_BOARD';

  const auth = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
  };
  const headers = (token = auth()?.access_token || KEY) => ({ apikey: KEY, Authorization: `Bearer ${token}` });
  const escapeHtml = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

  function toast(message) {
    document.querySelector('.profile-toast')?.remove();
    const item = document.createElement('div');
    item.className = 'profile-toast'; item.textContent = message;
    document.body.append(item);
    setTimeout(() => item.classList.add('show'), 20);
    setTimeout(() => item.remove(), 3600);
  }

  async function signedUrl(path) {
    if (!path) return '';
    const response = await fetch(`${API}/storage/v1/object/sign/${BUCKET}/${encodeURI(path)}`, {
      method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 86400 })
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data.signedURL ? `${API}/storage/v1${data.signedURL}` : '';
  }

  async function uploadFile(file, folder) {
    const session = auth();
    if (!session?.access_token || !session?.user?.id) throw new Error('请先在回忆灯塔登录，再保存到云端');
    const ext = (file.name?.split('.').pop() || 'bin').toLowerCase();
    const path = `${session.user.id}/${folder}/${crypto.randomUUID()}.${ext}`;
    const response = await fetch(`${API}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'false' }, body: file
    });
    if (!response.ok) throw new Error('上传失败，请稍后重试');
    return path;
  }

  function dialog(title, body) {
    const layer = document.createElement('div');
    layer.className = 'profile-editor-layer';
    layer.innerHTML = `<section class="profile-editor" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><button class="profile-editor-close" type="button" aria-label="关闭">×</button><p class="profile-editor-kicker">CHARACTER ARCHIVE</p><h2>${escapeHtml(title)}</h2>${body}</section>`;
    const close = () => layer.remove();
    layer.querySelector('.profile-editor-close').onclick = close;
    layer.onclick = event => { if (event.target === layer) close(); };
    document.body.append(layer);
    return { layer, close };
  }

  function profileValues(profile) {
    const copy = profile.querySelector('.profile-main > div:last-child');
    return {
      name: copy?.querySelector('h2')?.textContent.trim() || '椰椰',
      description: copy?.querySelector('p')?.textContent.trim() || '',
      quote: copy?.querySelector('blockquote')?.textContent.trim().replace(/[“”]/g, '') || '',
      avatarPath: profile.dataset.avatarPath || ''
    };
  }

  function applyProfile(profile, data) {
    const copy = profile.querySelector('.profile-main > div:last-child');
    if (!copy) return;
    if (data.name) copy.querySelector('h2').textContent = data.name;
    if (data.description) copy.querySelector('p').textContent = data.description;
    if (data.quote) copy.querySelector('blockquote').textContent = `“${data.quote}”`;
    if (data.avatarPath) profile.dataset.avatarPath = data.avatarPath;
    if (data.avatarUrl) profile.querySelector('.avatar img')?.setAttribute('src', data.avatarUrl);
  }

  async function loadProfile(profile) {
    const local = localStorage.getItem('yeye-profile-v1');
    if (local) { try { applyProfile(profile, JSON.parse(local)); } catch {} }
    try {
      const response = await fetch(`${API}/rest/v1/memory_photos?select=id,description&location=eq.${PROFILE_LOCATION}&order=created_at.desc&limit=1`, { headers: headers() });
      const rows = response.ok ? await response.json() : [];
      if (!rows[0]?.description) return;
      const data = JSON.parse(rows[0].description);
      if (data.avatarPath) data.avatarUrl = await signedUrl(data.avatarPath);
      applyProfile(profile, data);
      localStorage.setItem('yeye-profile-v1', JSON.stringify(data));
    } catch {}
  }

  function openProfileEditor(profile) {
    const value = profileValues(profile);
    const modal = dialog('编辑人物资料', `<form class="profile-form"><label>名字<input name="name" maxlength="20" value="${escapeHtml(value.name)}"></label><label>人物说明<textarea name="description" rows="5" maxlength="300">${escapeHtml(value.description)}</textarea></label><label>代表语<input name="quote" maxlength="80" value="${escapeHtml(value.quote)}"></label><label class="profile-file">更换人物照片<input name="avatar" type="file" accept="image/*"></label><button class="profile-save" type="submit">保存资料</button></form>`);
    modal.layer.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const data = { name: form.get('name').trim(), description: form.get('description').trim(), quote: form.get('quote').trim(), avatarPath: value.avatarPath };
      const file = form.get('avatar');
      const session = auth();
      try {
        if (file?.size) data.avatarPath = await uploadFile(file, 'profile');
        const localData = { ...data };
        if (data.avatarPath) localData.avatarUrl = await signedUrl(data.avatarPath);
        localStorage.setItem('yeye-profile-v1', JSON.stringify(localData));
        applyProfile(profile, localData);
        if (session?.access_token) {
          const query = await fetch(`${API}/rest/v1/memory_photos?select=id&location=eq.${PROFILE_LOCATION}&limit=1`, { headers: headers(session.access_token) });
          const rows = query.ok ? await query.json() : [];
          const payload = { description: JSON.stringify(data), location: PROFILE_LOCATION, storage_path: data.avatarPath || `profile/${session.user.id}.json`, ratio: 1 };
          const target = rows[0] ? `${API}/rest/v1/memory_photos?id=eq.${rows[0].id}` : `${API}/rest/v1/memory_photos`;
          const saved = await fetch(target, { method: rows[0] ? 'PATCH' : 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!saved.ok) throw new Error('云端保存失败');
          toast('人物资料已同步');
        } else toast('资料已保存到本机，登录后可同步');
        modal.close();
      } catch (error) { toast(error.message); }
    };
  }

  function enrichProfile(profile) {
    if (profile.dataset.pagePolished) return;
    profile.dataset.pagePolished = 'true';
    const copy = profile.querySelector('.profile-main > div:last-child');
    if (!copy) return;
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'profile-edit'; edit.textContent = '编辑人物资料';
    edit.onclick = () => openProfileEditor(profile);
    copy.append(edit);
    const chips = document.createElement('div');
    chips.className = 'profile-chips';
    chips.innerHTML = '<span>逻辑分析</span><span>整理能力</span><span>敏锐感知</span><span>喜欢小龙虾 · 辣 · 烧烤 · 三文鱼</span><span>害怕昆虫</span>';
    copy.append(chips);
    document.querySelector('.traits.standalone')?.classList.add('profile-hidden');
    loadProfile(profile);
  }

  async function updatePhoto(card, description, file) {
    const session = auth();
    if (!session?.access_token) throw new Error('请先在回忆灯塔登录，再编辑照片');
    const patch = { description };
    if (file?.size) patch.storage_path = await uploadFile(file, 'profile-gallery');
    const response = await fetch(`${API}/rest/v1/memory_photos?id=eq.${encodeURIComponent(card.dataset.id)}`, {
      method: 'PATCH', headers: { ...headers(session.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify(patch)
    });
    if (!response.ok) throw new Error('照片保存失败');
    card.querySelector('img').alt = description || '人物照片';
    card.querySelector('.profile-photo-caption').textContent = description || '未命名瞬间';
    if (patch.storage_path) card.querySelector('img').src = await signedUrl(patch.storage_path);
  }

  function openPhotoEditor(card) {
    const image = card.querySelector('img');
    if (!image || card.dataset.id === 'default') return;
    const modal = dialog('编辑这一瞬间', `<img class="profile-editor-preview" src="${escapeHtml(image.currentSrc || image.src)}" alt=""><form class="profile-form"><label>照片说明<input name="description" maxlength="120" value="${escapeHtml(image.alt === '人物照片' ? '' : image.alt)}"></label><label class="profile-file">更换照片<input name="photo" type="file" accept="image/*"></label><button class="profile-save" type="submit">保存照片</button></form>`);
    modal.layer.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const form = new FormData(event.currentTarget);
      try { await updatePhoto(card, form.get('description').trim(), form.get('photo')); toast('照片已更新'); modal.close(); } catch (error) { toast(error.message); }
    };
  }

  function enhanceGallery(section) {
    if (section.dataset.enhanced) return;
    section.dataset.enhanced = 'true';
    section.querySelector('h2').textContent = '展示星环';
    section.querySelector('.profile-gallery-note')?.remove();
    const observeCards = () => section.querySelectorAll('.profile-dome-item').forEach(card => {
      if (card.dataset.editable) return;
      card.dataset.editable = 'true';
      const caption = document.createElement('span');
      caption.className = 'profile-photo-caption'; caption.textContent = card.querySelector('img')?.alt || '未命名瞬间';
      card.append(caption);
      card.addEventListener('click', event => { event.stopPropagation(); openPhotoEditor(card); });
    });
    new MutationObserver(observeCards).observe(section.querySelector('.profile-dome-track'), { childList: true });
    observeCards();
  }

  async function loadMessages(board) {
    let messages = [];
    try {
      const response = await fetch(`${API}/rest/v1/memory_photos?select=id,description,created_at&location=eq.${MESSAGE_LOCATION}&order=created_at.desc&limit=24`, { headers: headers() });
      if (response.ok) messages = await response.json();
    } catch {}
    if (!messages.length) { try { messages = JSON.parse(localStorage.getItem('yeye-messages-v1') || '[]'); } catch {} }
    const list = board.querySelector('.message-list');
    list.innerHTML = messages.length ? messages.map(item => `<article><p>${escapeHtml(item.description)}</p><time>${new Date(item.created_at || Date.now()).toLocaleDateString('zh-CN')}</time></article>`).join('') : '<div class="message-empty">第一句话，等你来写。</div>';
  }

  function addMessageBoard(main) {
    if (main.querySelector('.message-board')) return;
    const board = document.createElement('section');
    board.className = 'message-board';
    board.innerHTML = '<div class="message-board-head"><p>MESSAGE BOARD</p><h2>留一句话</h2></div><div class="message-list"></div><form><textarea maxlength="180" rows="3" placeholder="写下想留给她的话…" required></textarea><button type="submit">留下这句话</button></form>';
    main.append(board);
    board.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const field = event.currentTarget.querySelector('textarea'); const value = field.value.trim(); if (!value) return;
      const session = auth();
      if (session?.access_token) {
        const path = `${session.user.id}/messages/${crypto.randomUUID()}.txt`;
        const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
        try {
          const stored = await fetch(`${API}/storage/v1/object/${BUCKET}/${path}`, { method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': blob.type, 'x-upsert': 'false' }, body: blob });
          if (!stored.ok) throw new Error();
          const saved = await fetch(`${API}/rest/v1/memory_photos`, { method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify({ storage_path: path, description: value, location: MESSAGE_LOCATION, ratio: 1 }) });
          if (!saved.ok) throw new Error();
          toast('留言已同步');
        } catch { toast('云端暂时没有保存成功'); return; }
      } else {
        let local = []; try { local = JSON.parse(localStorage.getItem('yeye-messages-v1') || '[]'); } catch {}
        local.unshift({ id: crypto.randomUUID(), description: value, created_at: new Date().toISOString() });
        localStorage.setItem('yeye-messages-v1', JSON.stringify(local.slice(0, 24))); toast('留言已保存在本机');
      }
      field.value = ''; loadMessages(board);
    };
    loadMessages(board);
  }

  function addLetter(main) {
    if (main.querySelector('.letter-easter-egg')) return;
    const letter = document.createElement('button');
    letter.type = 'button'; letter.className = 'letter-easter-egg'; letter.setAttribute('aria-label', '一封隐藏的信');
    letter.innerHTML = '<span>✉</span>';
    let count = 0, reset;
    letter.onclick = () => {
      count += 1; clearTimeout(reset); letter.classList.add('tapped'); setTimeout(() => letter.classList.remove('tapped'), 180);
      if (count >= 5) { count = 0; toast('向同行玩家拿取你的信件'); letter.classList.add('unlocked'); }
      else reset = setTimeout(() => { count = 0; }, 2600);
    };
    (main.querySelector('.message-board') || main).append(letter);
  }

  let queued = false;
  function scan() {
    queued = false;
    const profile = document.querySelector('.person-profile');
    if (!profile) return;
    document.querySelector('.traits.standalone')?.classList.add('profile-hidden');
    enrichProfile(profile);
    const gallery = document.querySelector('.profile-gallery-section');
    if (gallery) enhanceGallery(gallery);
    const main = profile.closest('main');
    if (main) { addMessageBoard(main); addLetter(main); }
  }
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(scan); } }).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
