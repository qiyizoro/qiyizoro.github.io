(() => {
  const API = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  const AUTH_KEY = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const compatibleTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  const session = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
  };

  const headers = token => ({ apikey: KEY, Authorization: `Bearer ${token}` });

  function prepareMemoryUploader(root = document) {
    const picker = root.querySelector?.('.memory-image-picker');
    if (!picker) return;

    const input = picker.querySelector('input[type="file"]');
    if (!input || input.dataset.mobileUploadReady === 'true') return;

    input.dataset.mobileUploadReady = 'true';
    input.accept = 'image/jpeg,image/png,image/webp';

    const editor = picker.closest('.memory-editor');
    editor?.querySelector('.eyebrow')?.remove();
    const title = editor?.querySelector('h2');
    if (title) title.textContent = '添加回忆';
    const description = editor?.querySelector('textarea');
    const location = editor?.querySelector('input:not([type="file"])');
    if (description) {
      description.placeholder = '写一句回忆';
      description.setAttribute('aria-label', '回忆说明');
      [...description.parentElement.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
    }
    if (location) {
      location.placeholder = '记录地点';
      location.setAttribute('aria-label', '地点');
      [...location.parentElement.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).forEach(node => node.remove());
    }
  }

  function showUploadMessage(input, message) {
    const editor = input.closest('.memory-editor');
    const existingNotice = editor?.querySelector('.memory-notice');
    if (existingNotice) {
      existingNotice.textContent = message;
      existingNotice.setAttribute('role', 'alert');
      return;
    }
    if (!editor) return;
    const notice = document.createElement('p');
    notice.className = 'memory-notice';
    notice.setAttribute('role', 'alert');
    notice.textContent = message;
    editor.prepend(notice);
  }

  async function saveMemory(editor, button) {
    const auth = session();
    const file = editor.querySelector('input[type="file"]')?.files?.[0];
    const description = editor.querySelector('textarea')?.value.trim();
    const place = editor.querySelector('input:not([type="file"])')?.value.trim();
    if (!auth?.access_token || !auth?.user?.id) throw new Error('登录已失效，请返回后重新进入回忆灯塔。');
    if (!file) throw new Error('请先选择一张照片。');
    if (!description || !place) throw new Error('请补充回忆和地点。');
    if (!compatibleTypes.has(file.type)) throw new Error('请选择 JPG、PNG 或 WebP 图片。');
    if (file.size > 15 * 1024 * 1024) throw new Error('照片不能超过 15MB。');

    const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;
    const image = editor.querySelector('.memory-image-picker img');
    const ratio = image?.naturalWidth && image?.naturalHeight
      ? Math.max(.75, Math.min(1.65, image.naturalHeight / image.naturalWidth))
      : 1.2;

    button.disabled = true;
    button.textContent = '正在保存…';
    showUploadMessage(editor.querySelector('input[type="file"]'), '正在保存…');

    const uploaded = await fetch(`${API}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: { ...headers(auth.access_token), 'Content-Type': file.type, 'x-upsert': 'false' },
      body: file
    });
    if (!uploaded.ok) throw new Error('照片上传失败，请检查网络后重试。');

    const saved = await fetch(`${API}/rest/v1/memory_photos`, {
      method: 'POST',
      headers: { ...headers(auth.access_token), 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ storage_path: path, description, location: place, ratio })
    });
    if (!saved.ok) {
      await fetch(`${API}/storage/v1/object/${BUCKET}/${path}`, { method: 'DELETE', headers: headers(auth.access_token) }).catch(() => {});
      throw new Error('照片信息保存失败，请稍后重试。');
    }

    button.textContent = '保存成功';
    setTimeout(() => location.reload(), 450);
  }

  document.addEventListener('change', event => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.closest('.memory-image-picker')) return;
    const file = input.files?.[0];
    if (!file) return;

    const extensionOkay = /\.(jpe?g|png|webp)$/i.test(file.name || '');
    if (compatibleTypes.has(file.type) || (!file.type && extensionOkay)) return;

    event.stopImmediatePropagation();
    input.value = '';
    showUploadMessage(input, '这张照片是 iPhone 实况/HEIC 格式，网页无法稳定显示。请先截屏，或导出为 JPG 后再上传。');
  }, true);

  document.addEventListener('click', event => {
    const button = event.target.closest('.memory-save');
    if (!button) return;
    const editor = button.closest('.memory-editor');
    if (!editor) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    saveMemory(editor, button).catch(error => {
      button.disabled = false;
      button.textContent = '保存';
      showUploadMessage(editor.querySelector('input[type="file"]'), error.message || '保存失败，请稍后重试。');
    });
  }, true);

  const observer = new MutationObserver(records => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.matches('.memory-editor, .memory-image-picker') || node.querySelector('.memory-image-picker')) {
          prepareMemoryUploader(node.matches('.memory-image-picker') ? node.parentElement : node);
        }
      }
    }
  });

  prepareMemoryUploader();
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
