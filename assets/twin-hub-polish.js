(() => {
  const API = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  let queued = false;

  async function signedUrl(path) {
    if (!path) return '';
    const response = await fetch(`${API}/storage/v1/object/sign/${BUCKET}/${encodeURI(path)}`, {
      method: 'POST', headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 86400 })
    });
    if (!response.ok) return '';
    const data = await response.json();
    return data.signedURL ? `${API}/storage/v1${data.signedURL}` : '';
  }

  function setPortrait(card, url, alt) {
    if (!card || !url) return;
    const frame = card.querySelector('.portrait-preview');
    if (!frame) return;
    let image = frame.querySelector('img');
    if (!image) { image = document.createElement('img'); frame.replaceChildren(image); }
    image.src = url; image.alt = alt; frame.classList.remove('empty');
  }

  async function syncPortraits(hub) {
    if (hub.dataset.portraitsSynced) return;
    hub.dataset.portraitsSynced = 'true';
    const cards = hub.querySelectorAll('.twin-module');
    const profiles = [
      { card: cards[0], name: '椰椰', location: 'YEYE_PROFILE', storage: 'yeye-profile-v1', fallback: '/images/yeye-avatar.jpg' },
      { card: cards[1], name: '柒柒', location: 'QIQI_PROFILE', storage: 'qiqi-profile-v1', fallback: '' }
    ];
    for (const item of profiles) {
      let local = null;
      try { local = JSON.parse(localStorage.getItem(item.storage) || 'null'); } catch {}
      setPortrait(item.card, local?.avatarUrl || item.fallback, item.name);
      try {
        const response = await fetch(`${API}/rest/v1/memory_photos?select=description&location=eq.${item.location}&order=created_at.desc&limit=1`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
        const rows = response.ok ? await response.json() : [];
        const data = rows[0]?.description ? JSON.parse(rows[0].description) : null;
        const url = await signedUrl(data?.avatarPath);
        if (url) { setPortrait(item.card, url, item.name); localStorage.setItem(item.storage, JSON.stringify({ ...data, avatarUrl: url })); }
      } catch {}
    }
  }

  function polishTwinHub() {
    queued = false;
    const heading = [...document.querySelectorAll('.subhero h1')].find(item => item.textContent.trim() === '双生之境');
    if (!heading) return;

    const subhero = heading.closest('.subhero');
    subhero?.classList.add('twin-subhero');
    subhero?.querySelector('.eyebrow')?.classList.add('twin-subhero-hidden');
    const intro = subhero?.querySelector('p:not(.eyebrow)');
    if (intro) intro.textContent = '四个入口，通往各自与共同的故事。';
    if (subhero && !subhero.querySelector('.twin-cosmos-mark')) {
      const mark = document.createElement('div');
      mark.className = 'twin-cosmos-mark';
      mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = '<div class="twin-orbits"><i></i><i></i><b>✦</b><b>✦</b></div><div class="twin-cosmos-copy"><em>04</em><span>个可探索入口</span></div>';
      subhero.append(mark);
    }

    const hub = document.querySelector('.twin-hub');
    if (!hub) return;
    hub.classList.add('twin-hub--illustrated');
    const names = ['yeye', 'qiqi', 'tasks', 'achievements'];
    [...hub.querySelectorAll('.twin-module')].forEach((card, index) => {
      if (!names[index]) return;
      card.classList.add(`twin-module--${names[index]}`);
    });
    const cards = hub.querySelectorAll('.twin-module');
    const yeyeTag = cards[0]?.querySelector('div > p');
    const qiqiTag = cards[1]?.querySelector('div > p');
    if (yeyeTag) yeyeTag.textContent = '神秘宇宙公民';
    if (qiqiTag) qiqiTag.textContent = '特殊宇宙公民';
    cards[0]?.querySelector('div > small')?.remove();
    cards[1]?.querySelector('div > small')?.remove();
    cards[2]?.querySelector('div > p')?.remove();
    cards[3]?.querySelector('div')?.remove();
    syncPortraits(hub);
  }

  window.addEventListener('profile-avatar-updated', event => {
    const hub = document.querySelector('.twin-hub');
    const index = event.detail?.location === 'QIQI_PROFILE' ? 1 : 0;
    setPortrait(hub?.querySelectorAll('.twin-module')[index], event.detail?.url, event.detail?.name);
  });

  new MutationObserver(() => {
    if (!queued) { queued = true; requestAnimationFrame(polishTwinHub); }
  }).observe(document.documentElement, { childList: true, subtree: true });
  polishTwinHub();
})();
