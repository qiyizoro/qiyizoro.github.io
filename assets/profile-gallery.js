(() => {
  const SUPABASE_URL = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const API_KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  const PASSWORD = '5555';
  const STATIC_IMAGES = [
    '056f8550052ef2a7555dc495d3064df1','0addb386b7f786e53c5ad6847a782bea','1fd1855678d8fa031423a19010491f53','3263147644bb23d24ff02d477eb59d03','3f98db47244f789e80280a1c51228526','5d5333bce38857361496aef772864b8e','79c038e5c2b2ca5d95206ab5da4d88a9','7ae4495085217870411b607dc78e448a','7cfca71f0fa6267ef888f407802508e4','8b9a0eef5ef5679aff97aff934d99b72','8dcefcbba1a1a51ca4cf598b1e6de6b6','911c8439a12510f5abbcf6df0e2ec3ec','951bc00cf71f80d19fd3bd550287dba4','99738617959a1b485e924d87bd4c7daa','9e412ede1ac8cf2b19af0ecf48941383','af2de118db20750586a7305cbac18916','d9e04edbb2617d1962e15189cc6c5234'
  ].map(name => ({ id: `static-${name}`, src: `/images/baby-gallery/${name}.webp`, description: '星环照片', static: true }));
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
    let rows = [];
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos?select=id,storage_path,description,location,created_at&order=created_at.desc&limit=60`, { headers: headers(token()) });
      if (response.ok) rows = (await response.json()).filter(row => !['WORLD_TREE_BUBBLE', 'YEYE_PROFILE', 'YEYE_MESSAGE_BOARD'].includes(row.location));
    } catch {}
    const cloud = (await Promise.all(rows.map(async row => ({ ...row, src: await signedUrl(row.storage_path) })))).filter(row => row.src);
    return [...STATIC_IMAGES, ...cloud].sort(() => Math.random() - .5);
  }

  function positionItems(track, rotation = { x: -2, y: 0 }) {
    const cards = [...track.children];
    const columns = Math.max(8, Math.ceil(cards.length / 3));
    const rows = Math.ceil(cards.length / columns);
    const radius = innerWidth < 700 ? 300 : Math.min(520, Math.max(390, innerWidth * .43));
    track.parentElement?.style.setProperty('--dome-radius', `${radius}px`);
    cards.forEach((card, index) => {
      const row = Math.floor(index / columns);
      const column = index % columns;
      const angleY = column / columns * 360 + (row % 2 ? 180 / columns : 0);
      const angleX = (row - (rows - 1) / 2) * (innerWidth < 700 ? 19 : 17);
      card.style.transform = `rotateY(${angleY}deg) rotateX(${-angleX}deg) translateZ(${radius}px)`;
    });
    track.style.transform = `translateZ(${-radius}px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`;
  }

  function showPhoto(section, photo) {
    const viewer = section.querySelector('.profile-dome-viewer');
    viewer.querySelector('img').src = photo.src;
    viewer.querySelector('img').alt = photo.description || '照片预览';
    viewer.hidden = false;
    requestAnimationFrame(() => viewer.classList.add('open'));
  }

  function render(track, photos, state) {
    track.replaceChildren();
    const pool = photos.length ? photos : [{ id: 'default', src: '/images/yeye-avatar.jpg', description: '椰椰' }];
    const total = Math.min(innerWidth < 700 ? 24 : 36, Math.max(innerWidth < 700 ? 18 : 27, pool.length * 2));
    for (let i = 0; i < total; i++) {
      const photo = pool[i % pool.length];
      const card = document.createElement('div');
      card.className = 'profile-dome-item'; card.tabIndex = 0; card.setAttribute('role', 'button'); card.setAttribute('aria-label', photo.description || '查看照片'); card.dataset.id = photo.id; card.dataset.path = photo.storage_path || '';
      card.innerHTML = `<img src="${photo.src}" alt="${photo.description || '人物照片'}" draggable="false" loading="lazy" decoding="async">`;
      let timer;
      const stop = () => { clearTimeout(timer); timer = null; };
      card.addEventListener('pointerdown', event => {
        if (event.pointerType !== 'touch') return;
        timer = setTimeout(() => removePhoto(photo, state), 700);
      });
      ['pointerup', 'pointercancel', 'pointermove'].forEach(name => card.addEventListener(name, stop));
      card.addEventListener('contextmenu', event => { event.preventDefault(); removePhoto(photo, state); });
      card.addEventListener('click', () => { if (!state.moved) showPhoto(state.section, photo); });
      card.addEventListener('keydown', event => { if ((event.key === 'Enter' || event.key === ' ') && !event.target.closest('.profile-photo-edit')) { event.preventDefault(); showPhoto(state.section, photo); } });
      track.append(card);
    }
    positionItems(track, state.rotation);
  }

  async function removePhoto(photo, state) {
    if (photo.id === 'default') return;
    if (photo.static) { alert('这张照片来自“宝宝”固定图库，如需移除请更新图库文件。'); return; }
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
    if (!stored.ok) { state.addLabel.textContent = '上传照片'; alert('照片上传失败，请稍后重试。'); return false; }
    const ratio = await new Promise(resolve => { const img = new Image(); img.onload = () => resolve(Math.max(.75, Math.min(1.65, img.height / img.width))); img.onerror = () => resolve(1); img.src = URL.createObjectURL(file); });
    const saved = await fetch(`${SUPABASE_URL}/rest/v1/memory_photos`, { method: 'POST', headers: { ...headers(auth.access_token), 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify({ storage_path: path, description: '椰椰的人物照片', location: '人物档案', ratio }) });
    if (!saved.ok) { state.addLabel.textContent = '上传照片'; alert('照片信息保存失败。'); return false; }
    state.addLabel.textContent = '上传照片';
    return true;
  }

  async function uploadMany(files, state) {
    const list = [...files];
    if (!list.length) return;
    for (let index = 0; index < list.length; index++) {
      state.addLabel.textContent = `正在上传 ${index + 1}/${list.length}`;
      const saved = await upload(list[index], state);
      if (!saved) break;
    }
    state.addLabel.textContent = '上传照片';
    state.photos = await loadPhotos(); render(state.track, state.photos, state);
  }

  async function mount(profile) {
    if (profile.dataset.galleryMounted) return;
    profile.dataset.galleryMounted = 'true'; profile.classList.add('magazine-profile');
    const section = document.createElement('section'); section.className = 'profile-gallery-section';
    section.innerHTML = `<div class="profile-gallery-head"><div><small>PERSONAL MOMENTS</small><h2>展示星环</h2></div><label class="profile-gallery-add"><span aria-hidden="true">＋</span><strong>上传照片</strong><small>支持多选</small><input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif"></label></div><div class="profile-dome" aria-label="椰椰的照片展示墙"><div class="profile-dome-track"></div><div class="profile-dome-overlay"></div><div class="profile-dome-viewer" hidden><button type="button" aria-label="关闭照片">×</button><img alt=""></div></div><p class="profile-gallery-note">拖动探索照片 · 点击查看 · 手机长按或电脑右键删除</p>`;
    profile.after(section);
    const dome = section.querySelector('.profile-dome'), track = section.querySelector('.profile-dome-track');
    const state = { section, track, photos: [], rotation: { x: -2, y: 0 }, moved: false, addLabel: section.querySelector('.profile-gallery-add strong') };
    state.photos = await loadPhotos(); render(track, state.photos, state);
    let down = false, startX = 0, startY = 0, startRotation, frame = 0, nextRotation, lastX = 0, lastY = 0, lastTime = 0, velocityX = 0, velocityY = 0, inertia = 0;
    const spin = () => {
      velocityX *= .94; velocityY *= .94;
      state.rotation.y += velocityX; state.rotation.x = Math.max(-16, Math.min(16, state.rotation.x - velocityY));
      positionItems(track, state.rotation);
      if (Math.abs(velocityX) + Math.abs(velocityY) > .025) inertia = requestAnimationFrame(spin); else inertia = 0;
    };
    dome.addEventListener('pointerdown', event => { cancelAnimationFrame(inertia); down = true; state.moved = false; startX = lastX = event.clientX; startY = lastY = event.clientY; lastTime = performance.now(); startRotation = { ...state.rotation }; dome.classList.add('dragging'); dome.setPointerCapture?.(event.pointerId); });
    dome.addEventListener('pointermove', event => {
      if (!down) return;
      const dx = event.clientX - startX, dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 5) state.moved = true;
      nextRotation = { x: Math.max(-16, Math.min(16, startRotation.x - dy * .055)), y: startRotation.y + dx * .12 };
      const now = performance.now(), elapsed = Math.max(8, now - lastTime);
      velocityX = (event.clientX - lastX) / elapsed * 7; velocityY = (event.clientY - lastY) / elapsed * 2.7;
      lastX = event.clientX; lastY = event.clientY; lastTime = now;
      if (frame) return;
      frame = requestAnimationFrame(() => { state.rotation = nextRotation; positionItems(track, state.rotation); frame = 0; });
    });
    const up = () => { if (!down) return; down = false; dome.classList.remove('dragging'); if (state.moved) { clearTimeout(state.clickTimer); state.clickTimer = setTimeout(() => { state.moved = false; }, 120); inertia = requestAnimationFrame(spin); } };
    dome.addEventListener('pointerup', up); dome.addEventListener('pointercancel', up);
    const viewer = section.querySelector('.profile-dome-viewer');
    const closeViewer = () => { viewer.classList.remove('open'); setTimeout(() => { viewer.hidden = true; viewer.querySelector('img').removeAttribute('src'); }, 260); };
    viewer.addEventListener('click', event => { if (event.target === viewer || event.target.closest('button')) closeViewer(); });
    viewer.addEventListener('keydown', event => { if (event.key === 'Escape') closeViewer(); });
    section.querySelector('input').addEventListener('change', async event => { const files = event.target.files; if (files?.length) await uploadMany(files, state); event.target.value = ''; });
    addEventListener('resize', () => positionItems(track, state.rotation), { passive: true });
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
