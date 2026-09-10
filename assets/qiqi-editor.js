(() => {
  const API = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  const AUTH_KEY = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const STORE = { moments: 'qiqi-moments-v1', notes: 'qiqi-notes-v1' };
  let mounted = false;

  const session = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; } };
  const headers = token => ({ apikey: KEY, Authorization: `Bearer ${token || KEY}` });
  const escape = value => String(value || '').replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
  const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const today = () => new Date().toISOString().slice(0, 10);

  function toast(text) {
    document.querySelector('.qiqi-toast')?.remove();
    const item = document.createElement('div'); item.className = 'qiqi-toast'; item.textContent = text; document.body.append(item);
    requestAnimationFrame(() => item.classList.add('show')); setTimeout(() => item.remove(), 2800);
  }

  async function load(key) {
    let value = []; try { value = JSON.parse(localStorage.getItem(STORE[key]) || '[]'); } catch {}
    const auth = session(); if (!auth?.access_token) return value;
    try {
      const response = await fetch(`${API}/rest/v1/site_data?select=value&key=eq.${STORE[key]}`, { headers: headers(auth.access_token) });
      const rows = response.ok ? await response.json() : [];
      if (Array.isArray(rows[0]?.value)) { value = rows[0].value; localStorage.setItem(STORE[key], JSON.stringify(value)); }
    } catch {}
    return value;
  }

  async function save(key, value) {
    localStorage.setItem(STORE[key], JSON.stringify(value));
    const auth = session(); if (!auth?.access_token) { toast('已保存在当前设备'); return; }
    const response = await fetch(`${API}/rest/v1/site_data`, { method:'POST', headers:{ ...headers(auth.access_token), 'Content-Type':'application/json', Prefer:'resolution=merge-duplicates' }, body:JSON.stringify({ key:STORE[key], value, updated_at:new Date().toISOString() }) });
    toast(response.ok ? '已同步到云端' : '已保存在当前设备，云端同步稍后重试');
  }

  async function upload(file) {
    if (!file?.size) return null;
    const auth = session();
    if (!auth?.access_token || !auth?.user?.id) return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve({ image:reader.result }); reader.onerror = reject; reader.readAsDataURL(file); });
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase(); const path = `${auth.user.id}/qiqi-moments/${uid()}.${ext}`;
    const response = await fetch(`${API}/storage/v1/object/${BUCKET}/${path}`, { method:'POST', headers:{ ...headers(auth.access_token), 'Content-Type':file.type || 'application/octet-stream', 'x-upsert':'false' }, body:file });
    if (!response.ok) throw new Error('照片上传失败'); return { imagePath:path };
  }

  async function imageUrl(item) {
    if (item.image) return item.image; if (!item.imagePath) return '';
    try { const response = await fetch(`${API}/storage/v1/object/sign/${BUCKET}/${encodeURI(item.imagePath)}`, { method:'POST', headers:{ ...headers(), 'Content-Type':'application/json' }, body:JSON.stringify({ expiresIn:86400 }) }); const data = response.ok ? await response.json() : {}; return data.signedURL ? `${API}/storage/v1${data.signedURL}` : ''; } catch { return ''; }
  }

  function modal(title, fields, onSave) {
    const layer = document.createElement('div'); layer.className = 'qiqi-modal-layer';
    layer.innerHTML = `<section class="qiqi-modal" role="dialog" aria-modal="true"><button class="qiqi-close" type="button" aria-label="关闭">×</button><small>PERSONAL RECORD</small><h2>${escape(title)}</h2><form>${fields}<button class="qiqi-save" type="submit">保存</button></form></section>`;
    const close = () => layer.remove(); layer.querySelector('.qiqi-close').onclick = close; layer.onclick = e => { if (e.target === layer) close(); };
    layer.querySelector('form').onsubmit = async e => { e.preventDefault(); const button = e.currentTarget.querySelector('.qiqi-save'); button.disabled = true; button.textContent = '保存中…'; try { await onSave(new FormData(e.currentTarget)); close(); } catch (error) { toast(error.message || '保存失败'); button.disabled = false; button.textContent = '保存'; } };
    document.body.append(layer); return layer;
  }

  function momentEditor(current, done) {
    return modal(current ? '编辑这一瞬间' : '记录新的瞬间', `<label>照片<input name="image" type="file" accept="image/*" ${current ? '' : 'required'}></label><label>标题<input name="title" maxlength="50" required value="${escape(current?.title)}"></label><label>日期<input name="date" type="date" value="${escape(current?.date || today())}"></label><label>说明<textarea name="description" rows="4" maxlength="240">${escape(current?.description)}</textarea></label>`, async form => {
      const file = form.get('image'); const uploaded = file?.size ? await upload(file) : {};
      await done({ ...(current || {}), id:current?.id || uid(), title:form.get('title').trim(), date:form.get('date') || today(), description:form.get('description').trim(), ...uploaded });
    });
  }

  function noteEditor(current, done) {
    return modal(current ? '编辑这句碎碎念' : '写一句碎碎念', `<label>日期<input name="date" type="date" value="${escape(current?.date || today())}"></label><label>想说的话<textarea name="text" rows="5" maxlength="280" required>${escape(current?.text)}</textarea></label>`, async form => done({ ...(current || {}), id:current?.id || uid(), date:form.get('date') || today(), text:form.get('text').trim() }));
  }

  async function mount() {
    const title = [...document.querySelectorAll('.subhero h1')].find(item => item.textContent.includes('柒柒'));
    if (!title) { mounted = false; return; } if (mounted) return; mounted = true;
    const sections = document.querySelectorAll('.diary-section'); if (sections.length < 2) return;
    let moments = await load('moments'); let notes = await load('notes');
    sections[0].innerHTML = '<div class="qiqi-section-head"><div><small>PERSONAL MOMENTS</small><h2>记录瞬间</h2></div><button type="button" class="qiqi-add">＋ 添加瞬间</button></div><div class="qiqi-moment-grid"></div>';
    sections[1].innerHTML = '<div class="qiqi-section-head"><div><small>DAILY NOTES</small><h2>每日碎碎念</h2></div><button type="button" class="qiqi-add">＋ 添加一句</button></div><div class="qiqi-note-list"></div>';
    const renderMoments = async () => {
      const grid = sections[0].querySelector('.qiqi-moment-grid'); grid.innerHTML = moments.length ? '' : '<p class="qiqi-empty">还没有记录，留住第一个瞬间吧。</p>';
      for (const item of moments) { const article = document.createElement('article'); const url = await imageUrl(item); article.innerHTML = `${url ? `<img src="${escape(url)}" alt="${escape(item.title)}">` : '<div class="qiqi-photo-empty">✦</div>'}<div><time>${escape(item.date)}</time><h3>${escape(item.title)}</h3><p>${escape(item.description)}</p><nav><button data-action="edit">编辑</button><button data-action="delete">删除</button></nav></div>`; article.querySelector('[data-action=edit]').onclick = () => momentEditor(item, async updated => { moments = moments.map(x => x.id === item.id ? updated : x); await save('moments', moments); renderMoments(); }); article.querySelector('[data-action=delete]').onclick = async () => { if (!confirm('删除这一瞬间？')) return; moments = moments.filter(x => x.id !== item.id); await save('moments', moments); renderMoments(); }; grid.append(article); }
    };
    const renderNotes = () => { const list = sections[1].querySelector('.qiqi-note-list'); list.innerHTML = notes.length ? notes.map(item => `<article data-id="${escape(item.id)}"><time>${escape(item.date)}</time><p>${escape(item.text)}</p><nav><button data-action="edit">编辑</button><button data-action="delete">删除</button></nav></article>`).join('') : '<p class="qiqi-empty">今天还没有碎碎念。</p>'; list.querySelectorAll('article').forEach(article => { const item = notes.find(x => x.id === article.dataset.id); article.querySelector('[data-action=edit]').onclick = () => noteEditor(item, async updated => { notes = notes.map(x => x.id === item.id ? updated : x); await save('notes', notes); renderNotes(); }); article.querySelector('[data-action=delete]').onclick = async () => { if (!confirm('删除这句碎碎念？')) return; notes = notes.filter(x => x.id !== item.id); await save('notes', notes); renderNotes(); }; }); };
    sections[0].querySelector('.qiqi-add').onclick = () => momentEditor(null, async item => { moments.unshift(item); await save('moments', moments); renderMoments(); });
    sections[1].querySelector('.qiqi-add').onclick = () => noteEditor(null, async item => { notes.unshift(item); await save('notes', notes); renderNotes(); });
    renderMoments(); renderNotes();
  }
  new MutationObserver(mount).observe(document.documentElement, { childList:true, subtree:true }); mount();
})();
