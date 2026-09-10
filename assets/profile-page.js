(() => {
  const API = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  const AUTH_KEY = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const PROFILE_CONFIG = {
    '椰椰': { location: 'YEYE_PROFILE', storage: 'yeye-profile-v1', folder: 'profile' },
    '柒柒': { location: 'QIQI_PROFILE', storage: 'qiqi-profile-v1', folder: 'qiqi-profile' }
  };
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
    if (!file.type?.startsWith('image/')) throw new Error('请选择图片文件');
    if (file.size > 15 * 1024 * 1024) throw new Error('图片不能超过 15MB');
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
      traits: [...copy?.querySelectorAll('.profile-chips span') || []].map(item => item.textContent.trim()),
      avatarPath: profile.dataset.avatarPath || ''
    };
  }

  function applyProfile(profile, data) {
    const copy = profile.querySelector('.profile-main > div:last-child');
    if (!copy) return;
    if (data.name) copy.querySelector('h2').textContent = data.name;
    if (data.description) copy.querySelector('p').textContent = data.description;
    if (data.quote && copy.querySelector('blockquote')) copy.querySelector('blockquote').textContent = `“${data.quote}”`;
    if (Array.isArray(data.traits) && data.traits.length) {
      let chips = copy.querySelector('.profile-chips');
      if (!chips) { chips = document.createElement('div'); chips.className = 'profile-chips'; copy.append(chips); }
      chips.replaceChildren(...data.traits.map(value => { const chip = document.createElement('span'); chip.textContent = value; return chip; }));
    }
    if (data.avatarPath) profile.dataset.avatarPath = data.avatarPath;
    if (data.avatarUrl) {
      const avatar = profile.querySelector('.avatar');
      let image = avatar?.querySelector('img');
      if (avatar && !image) {
        image = document.createElement('img');
        image.alt = `${data.name || '人物'}的头像`;
        avatar.prepend(image);
        avatar.querySelectorAll('svg, small').forEach(item => item.remove());
        avatar.classList.remove('empty-avatar');
      }
      image?.setAttribute('src', data.avatarUrl);
    }
  }

  async function loadProfile(profile, config) {
    const local = localStorage.getItem(config.storage);
    if (local) { try { applyProfile(profile, JSON.parse(local)); } catch {} }
    try {
      const response = await fetch(`${API}/rest/v1/memory_photos?select=id,description&location=eq.${config.location}&order=created_at.desc&limit=1`, { headers: headers() });
      const rows = response.ok ? await response.json() : [];
      if (!rows[0]?.description) return;
      const data = JSON.parse(rows[0].description);
      if (data.avatarPath) data.avatarUrl = await signedUrl(data.avatarPath);
      applyProfile(profile, data);
      localStorage.setItem(config.storage, JSON.stringify(data));
    } catch {}
  }

  function openProfileEditor(profile, config) {
    const value = profileValues(profile);
    const modal = dialog('编辑人物资料', `<form class="profile-form"><label>名字<input name="name" maxlength="20" value="${escapeHtml(value.name)}"></label><label>人物说明<textarea name="description" rows="5" maxlength="300">${escapeHtml(value.description)}</textarea></label><label>人物特点<textarea name="traits" rows="3" maxlength="180" placeholder="用逗号分隔，例如：睿智，小龙虾，敏锐感知">${escapeHtml(value.traits.join('，'))}</textarea></label><label>代表语<input name="quote" maxlength="80" value="${escapeHtml(value.quote)}"></label><label class="profile-file">更换人物照片<input name="avatar" type="file" accept="image/*"></label><button class="profile-save" type="submit">保存资料</button></form>`);
    modal.layer.querySelector('form').onsubmit = async event => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const traits = form.get('traits').split(/[，,、]+/).map(item => item.trim()).filter(Boolean).slice(0, 8);
      const data = { name: form.get('name').trim(), description: form.get('description').trim(), traits, quote: form.get('quote').trim(), avatarPath: value.avatarPath };
      const file = form.get('avatar');
      const session = auth();
      try {
        if (file?.size) data.avatarPath = await uploadFile(file, config.folder);
        const localData = { ...data };
        if (data.avatarPath) localData.avatarUrl = await signedUrl(data.avatarPath);
        localStorage.setItem(config.storage, JSON.stringify(localData));
        applyProfile(profile, localData);
        window.dispatchEvent(new CustomEvent('profile-avatar-updated', { detail: { location: config.location, name: data.name, url: localData.avatarUrl } }));
        if (session?.access_token) {
          const query = await fetch(`${API}/rest/v1/memory_photos?select=id&location=eq.${config.location}&limit=1`, { headers: headers(session.access_token) });
          const rows = query.ok ? await query.json() : [];
          const payload = { description: JSON.stringify(data), location: config.location, storage_path: data.avatarPath || `${config.folder}/${session.user.id}.json`, ratio: 1 };
          const target = rows[0] ? `${API}/rest/v1/memory_photos?id=eq.${rows[0].id}` : `${API}/rest/v1/memory_photos`;
          const saved = await fetch(target, { method: rows[0] ? 'PATCH' : 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!saved.ok) throw new Error('云端保存失败');
          toast('人物资料已同步');
        } else toast('资料已保存到本机，登录后可同步');
        modal.close();
      } catch (error) { toast(error.message); }
    };
  }

  function enrichProfile(profile, config, isYeye) {
    if (profile.dataset.pagePolished) return;
    profile.dataset.pagePolished = 'true';
    const copy = profile.querySelector('.profile-main > div:last-child');
    if (!copy) return;
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'profile-edit'; edit.textContent = '编辑人物资料';
    edit.onclick = () => openProfileEditor(profile, config);
    copy.append(edit);
    const avatar = profile.querySelector('.avatar');
    if (avatar) {
      avatar.classList.add('profile-avatar-editable');
      avatar.addEventListener('click', () => openProfileEditor(profile, config));
    }
    if (isYeye) {
      const chips = document.createElement('div');
      chips.className = 'profile-chips';
      chips.innerHTML = '<span>逻辑分析</span><span>整理能力</span><span>敏锐感知</span><span>喜欢小龙虾 · 辣 · 烧烤 · 三文鱼</span><span>害怕昆虫</span>';
      copy.append(chips);
      document.querySelector('.traits.standalone')?.classList.add('profile-hidden');
    }
    loadProfile(profile, config);
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
    const caption = card.querySelector('.profile-photo-caption'); if (caption) caption.textContent = description || '未命名瞬间';
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
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'profile-photo-edit'; edit.setAttribute('aria-label', '编辑这张照片'); edit.textContent = '✎';
      edit.addEventListener('click', event => { event.stopPropagation(); openPhotoEditor(card); });
      card.append(edit);
    });
    new MutationObserver(observeCards).observe(section.querySelector('.profile-dome-track'), { childList: true });
    observeCards();
  }

  async function loadMessages(board) {
    let cloud = [];
    try {
      const response = await fetch(`${API}/rest/v1/memory_photos?select=id,storage_path,description,created_at&location=eq.${MESSAGE_LOCATION}&order=created_at.desc&limit=24`, { headers: headers(auth()?.access_token) });
      if (response.ok) cloud = await response.json();
    } catch {}
    let local = [];
    try { local = JSON.parse(localStorage.getItem('yeye-messages-v2') || localStorage.getItem('yeye-messages-v1') || '[]'); } catch {}
    const cloudPaths = new Set(cloud.map(item => item.storage_path).filter(Boolean));
    const messages = [...cloud, ...local.filter(item => !cloudPaths.has(item.storage_path))].slice(0, 32);
    const list = board.querySelector('.message-list');
    list.innerHTML = messages.map((item, index) => {
      const seed = [...String(item.id || index)].reduce((total, char) => total + char.charCodeAt(0), 0);
      const top = 12 + (seed % 6) * 14;
      const duration = 17 + seed % 13;
      const delay = -(seed % duration);
      const cloudId = item.cloud_id || (cloud.includes(item) ? item.id : '');
      return `<article data-id="${escapeHtml(item.id)}" data-cloud-id="${escapeHtml(cloudId)}" data-path="${escapeHtml(item.storage_path || '')}" style="--message-top:${top}%;--message-duration:${duration}s;--message-delay:${delay}s"><p>${escapeHtml(item.description)}</p><time>${item.pending ? '待同步' : new Date(item.created_at || Date.now()).toLocaleDateString('zh-CN')}</time><button type="button" aria-label="删除这条便签">×</button></article>`;
    }).join('');
    list.querySelectorAll('article button').forEach(button => {
      button.onclick = async event => {
        event.stopPropagation();
        if (!confirm('删除这条便签？')) return;
        const article = button.closest('article');
        const id = article.dataset.id; const cloudId = article.dataset.cloudId; const path = article.dataset.path; const user = auth();
        if (cloudId && !user?.access_token) { toast('请先登录后删除云端便签'); return; }
        if (cloudId && user?.access_token) {
          const removed = await fetch(`${API}/rest/v1/memory_photos?id=eq.${encodeURIComponent(cloudId)}`, { method: 'DELETE', headers: headers(user.access_token) });
          if (!removed.ok) { toast('删除失败，请稍后重试'); return; }
        }
        let saved = []; try { saved = JSON.parse(localStorage.getItem('yeye-messages-v2') || '[]'); } catch {}
        localStorage.setItem('yeye-messages-v2', JSON.stringify(saved.filter(item => String(item.id) !== String(id) && item.storage_path !== path)));
        article.remove(); toast('便签已删除');
      };
    });
  }

  async function syncMessage(item) {
    const session = auth();
    if (!session?.access_token || !session?.user?.id) return null;
    const response = await fetch(`${API}/rest/v1/memory_photos`, {
      method: 'POST', headers: { ...headers(session.access_token), 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ storage_path: item.storage_path, description: item.description, location: MESSAGE_LOCATION, ratio: 1 })
    });
    if (!response.ok) return null;
    const rows = await response.json();
    return rows[0] || null;
  }

  async function retryPendingMessages(board) {
    const session = auth(); if (!session?.access_token) return;
    let local = []; try { local = JSON.parse(localStorage.getItem('yeye-messages-v2') || '[]'); } catch {}
    let changed = false;
    for (const item of local.filter(message => message.pending)) {
      const saved = await syncMessage(item);
      if (saved) { item.pending = false; item.cloud_id = saved.id; changed = true; }
    }
    if (changed) { localStorage.setItem('yeye-messages-v2', JSON.stringify(local)); loadMessages(board); }
  }

  function addMessageBoard(main) {
    if (main.querySelector('.message-board')) return;
    const board = document.createElement('section');
    board.className = 'message-board';
    board.innerHTML = `<div class="message-board-head"><div><p>NOTE WALL</p><h2>便签墙</h2></div><span class="message-sync-state">${auth()?.access_token ? '云端同步' : '本机保存'}</span></div><div class="message-list" aria-live="polite"></div><form><textarea maxlength="180" rows="3" placeholder="写下一张新便签…" required></textarea><button type="submit">添加便签</button><div class="message-compose-meta"><span>Ctrl + Enter 快速添加</span><span class="message-counter">0 / 180</span></div></form>`;
    main.append(board);
    const footer = main.querySelector('footer');
    if (footer) main.append(footer);
    const textarea = board.querySelector('textarea');
    textarea.addEventListener('input', () => { board.querySelector('.message-counter').textContent = `${textarea.value.length} / 180`; });
    textarea.addEventListener('keydown', event => { if (event.ctrlKey && event.key === 'Enter') board.querySelector('form').requestSubmit(); });
    board.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const field = event.currentTarget.querySelector('textarea'); const value = field.value.trim(); if (!value) return;
      const session = auth();
      const id = crypto.randomUUID();
      const item = { id, storage_path: `message-notes/${session?.user?.id || 'local'}/${id}.json`, description: value, created_at: new Date().toISOString(), pending: true };
      let local = []; try { local = JSON.parse(localStorage.getItem('yeye-messages-v2') || localStorage.getItem('yeye-messages-v1') || '[]'); } catch {}
      local.unshift(item); localStorage.setItem('yeye-messages-v2', JSON.stringify(local.slice(0, 32)));
      field.value = ''; board.querySelector('.message-counter').textContent = '0 / 180'; await loadMessages(board);
      if (!session?.access_token) { toast('便签已保存在本机'); return; }
      const saved = await syncMessage(item);
      if (!saved) { toast('便签已保留，将在网络恢复后重试'); return; }
      item.pending = false; item.cloud_id = saved.id;
      localStorage.setItem('yeye-messages-v2', JSON.stringify(local));
      toast('便签已同步'); loadMessages(board);
    };
    loadMessages(board).then(() => retryPendingMessages(board));
  }

  function addLetter(main) {
    if (main.querySelector('.letter-easter-egg')) return;
    const letter = document.createElement('button');
    letter.type = 'button'; letter.className = 'letter-easter-egg'; letter.setAttribute('aria-label', '一封隐藏的信');
    letter.innerHTML = '<img src="/images/letter-envelope-v2.png" alt="" draggable="false">';
    let count = 0, reset;
    letter.onclick = () => {
      count += 1; clearTimeout(reset); letter.classList.remove('tapped'); void letter.offsetWidth; letter.classList.add('tapped'); setTimeout(() => letter.classList.remove('tapped'), 620);
      if (count >= 5) { count = 0; toast('向同行玩家拿取你的信件'); letter.classList.add('unlocked'); }
      else reset = setTimeout(() => { count = 0; }, 2600);
    };
    (main.querySelector('.person-profile') || main).append(letter);
  }

  let queued = false;
  function scan() {
    queued = false;
    const profile = document.querySelector('.person-profile');
    if (!profile) return;
    const profileName = profile.querySelector('.profile-main h2')?.textContent.trim() || '';
    const isYeye = profileName === '椰椰';
    const isQiqi = profileName === '柒柒';
    profile.classList.add('magazine-profile');
    profile.classList.toggle('yeye-magazine-profile', isYeye);
    profile.classList.toggle('qiqi-magazine-profile', isQiqi);
    const subhero = document.querySelector('.subhero');
    if (subhero && isYeye) {
      subhero.querySelector('.eyebrow')?.classList.add('profile-hidden');
      const title = subhero.querySelector('h1');
      if (title) title.textContent = '椰椰的书房';
      const intro = subhero.querySelector('p:not(.eyebrow)');
      if (intro) intro.textContent = intro.textContent.replace('星图', '神秘');
    }
    const config = PROFILE_CONFIG[profileName];
    if (isYeye) {
      document.querySelector('.traits.standalone')?.classList.add('profile-hidden');
    }
    if (config) enrichProfile(profile, config, isYeye);
    const gallery = document.querySelector('.profile-gallery-section');
    if (gallery && isYeye) enhanceGallery(gallery);
    const main = profile.closest('main');
    if (main && isYeye) { addMessageBoard(main); addLetter(main); }
  }
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(scan); } }).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
