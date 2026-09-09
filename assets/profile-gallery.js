(() => {
  const SUPABASE_URL = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const API_KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  const PASSWORD = '5555';
  const authKey = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const headers = token => ({ apikey: API_KEY, Authorization: `Bearer ${token || API_KEY}` });
  const session = () => {
    try { return JSON.parse(localStorage.getItem(authKey) || 'null'); } catch { return null; }
  };
  const token = () => session()?.access_token || '';

  async function signedUrl(path) {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${encodeURI(path)}`, {
      method: 'POST', headers: { ...headers(token()), 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 86400 })
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data.signedURL ? `${SUPABASE_URL}/storage/v1${data.signedURL}` : '';
  }

  async function loadPhotos() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos?select=id,storage_path,description,created_at&order=created_at.desc&limit=30`, { headers: headers(token()) });
    if (!response.ok) return [];
    const rows = await response.json();
    return (await Promise.all(rows.map(async row => ({ ...row, src: await signedUrl(row.storage_path) })))).filter(row => row.src);
  }

  function positionItems(track, offset = 0) {
    const mobile = innerWidth < 700;
    const cards = [...track.children];
    const count = Math.max(cards.length, 1);
    const radius = mobile ? 330 : 500;
    cards.forEach((card, index) => {
      const angle = ((index / count) * 360 + offset) * Math.PI / 180;
      const x = Math.sin(angle) * radius;
      const z = Math.cos(angle) * radius - radius;
      const row = index % 3 - 1;
      card.style.transform = `translate3d(${x}px,${row * (mobile ? 118 : 155)}px,${z}px) rotateY(${angle * 180 / Math.PI}deg)`;
      card.style.opacity = Math.cos(angle) < -.62 ? '.12' : '1';
    });
  }

  function render(track, photos, state) {
    track.replaceChildren();
    const pool = photos.length ? photos : [{ id: 'default', src: '/images/yeye-avatar.jpg', description: '椰椰' }];
    const total = Math.max(18, pool.length * 5);
    for (let i = 0; i < total; i++) {
      const photo = pool[i % pool.length];
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'profile-dome-item'; card.dataset.id = photo.id; card.dataset.path = photo.storage_path || '';
      card.innerHTML = `<img src="${photo.src}" alt="${photo.description || '人物照片'}" draggable="false">`;
      let timer;
      const stop = () => { clearTimeout(timer); timer = null; };
      card.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return;
        timer = setTimeout(() => removePhoto(photo, state), 700);
      });
      ['pointerup', 'pointercancel', 'pointermove'].forEach(name => card.addEventListener(name, stop));
      card.addEventListener('contextmenu', event => { event.preventDefault(); removePhoto(photo, state); });
      track.append(card);
    }
    positionItems(track, state.offset);
  }

  async function removePhoto(photo, state) {
    if (photo.id === 'default') return;
    if (prompt('请输入删除密码') !== PASSWORD) { alert('密码不正确'); return; }
    if (!token()) { alert('请先在“回忆灯塔”登录云端账号后再删除。'); return; }
    const response = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos?id=eq.${encodeURIComponent(photo.id)}`, { method: 'DELETE', headers: headers(token()) });
    if (!response.ok) { alert('删除失败，请稍后重试。'); return; }
    await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}`, { method: 'DELETE', headers: { ...headers(token()), 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [photo.storage_path] }) });
    state.photos = state.photos.filter(item => item.id !== photo.id);
    render(state.track, state.photos, state);
  }

  async function upload(file, state) {
    const auth = session();
    if (!auth?.access_token || !auth?.user?.id) {
      alert('请先进入“回忆灯塔”登录云端账号，再回来上传照片。');
      document.querySelectorAll('header nav button').forEach(button => { if (button.textContent.trim() === '回忆灯塔') button.click(); });
      return;
    }
    if (!file.type.startsWith('image/') || file.size > 15 * 1024 * 1024) { alert('请选择不超过 15MB 的图片。'); return; }
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${auth.user.id}/${crypto.randomUUID()}.${ext}`;
    state.addLabel.textContent = '正在上传…';
    const stored = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`, { method: 'POST', headers: { ...headers(auth.access_token), 'Content-Type': file.type, 'x-upsert': 'false' }, body: file });
    if (!stored.ok) { state.addLabel.textContent = '＋ 增加照片'; alert('照片上传失败，请稍后重试。'); return; }
    const ratio = await new Promise(resolve => { const img = new Image(); img.onload = () => resolve(Math.max(.75, Math.min(1.65, img.height / img.width))); img.onerror = () => resolve(1); img.src = URL.createObjectURL(file); });
    const saved = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos`, { method: 'POST', headers: { ...headers(auth.access_token), 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ storage_path: path, description: '椰椰的人物照片', location: '人物档案', ratio }) });
    if (!saved.ok) { state.addLabel.textContent = '＋ 增加照片'; alert('照片信息保存失败。'); return; }
    state.addLabel.textContent = '＋ 增加照片';
    state.photos = await loadPhotos(); render(state.track, state.photos, state);
  }

  async function mount(profile) {
    if (profile.dataset.galleryMounted) return;
    profile.dataset.galleryMounted = 'true'; profile.classList.add('magazine-profile');
    const section = document.createElement('section'); section.className = 'profile-gallery-section';
    section.innerHTML = `<div class="profile-gallery-head"><div><small>PERSONAL MOMENTS</small><h2>椰椰的照片星环</h2></div><label class="profile-gallery-add"><span>＋ 增加照片</span><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif"></label></div><div class="profile-dome" aria-label="椰椰的照片展示墙"><div class="profile-dome-track"></div></div><p class="profile-gallery-note">拖动探索照片 · 点击查看 · 手机长按或电脑右键删除</p>`;
    profile.after(section);
    const dome = section.querySelector('.profile-dome'), track = section.querySelector('.profile-dome-track');
    const state = { track, photos: [], offset: 0, addLabel: section.querySelector('.profile-gallery-add span') };
    state.photos = await loadPhotos(); render(track, state.photos, state);
    let down = false, startX = 0, startOffset = 0;
    dome.addEventListener('pointerdown', event => { down = true; startX = event.clientX; startOffset = state.offset; dome.classList.add('dragging'); dome.setPointerCapture?.(event.pointerId); });
    dome.addEventListener('pointermove', event => { if (!down) return; state.offset = startOffset + (event.clientX - startX) * .18; positionItems(track, state.offset); });
    const up = () => { down = false; dome.classList.remove('dragging'); };
    dome.addEventListener('pointerup', up); dome.addEventListener('pointercancel', up);
    section.querySelector('input').addEventListener('change', event => { const file = event.target.files?.[0]; if (file) upload(file, state); event.target.value = ''; });
    addEventListener('resize', () => positionItems(track, state.offset), { passive: true });
  }

  let queued = false;
  const scan = () => {
    queued = false;
    const profile = document.querySelector('.person-profile');
    if (profile && profile.querySelector('h2')?.textContent.trim() === '椰椰') mount(profile);
  };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(scan); } }).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
