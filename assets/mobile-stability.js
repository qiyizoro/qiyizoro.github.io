(() => {
  const compatibleTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

  function prepareMemoryUploader(root = document) {
    const picker = root.querySelector?.('.memory-image-picker');
    if (!picker) return;

    const input = picker.querySelector('input[type="file"]');
    if (!input || input.dataset.mobileUploadReady === 'true') return;

    input.dataset.mobileUploadReady = 'true';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.setAttribute('aria-describedby', 'memory-upload-format-hint');

    const hint = document.createElement('small');
    hint.id = 'memory-upload-format-hint';
    hint.className = 'memory-upload-format-hint';
    hint.textContent = '支持 JPG、PNG、WebP；iPhone 实况照片可先截屏或导出后上传。';
    picker.insertAdjacentElement('afterend', hint);
  }

  function showUploadMessage(input, message) {
    const editor = input.closest('.memory-editor');
    const notice = editor?.querySelector('.memory-notice');
    if (notice) {
      notice.textContent = message;
      notice.setAttribute('role', 'alert');
      return;
    }
    const hint = editor?.querySelector('.memory-upload-format-hint');
    if (hint) hint.textContent = message;
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
