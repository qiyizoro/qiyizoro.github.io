(() => {
  const API = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const BUCKET = 'memory-photos';
  const AUTH_KEY = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const quotes = [
    ['重要的东西，用眼睛是看不见的。', '《小王子》· 安托万·德·圣-埃克苏佩里'],
    ['生活就像一盒巧克力，你永远不知道下一颗是什么。', '《阿甘正传》'],
    ['决定我们成为什么样人的，不是能力，而是选择。', '《哈利·波特与密室》'],
    ['纵有疾风起，人生不言弃。', '《起风了》'],
    ['有些鸟儿是关不住的，它们的羽毛太鲜亮了。', '《肖申克的救赎》'],
    ['要么忙着活，要么忙着死。', '《肖申克的救赎》'],
    ['所有的大人都曾经是小孩，虽然只有少数人记得。', '《小王子》'],
    ['山重水复疑无路，柳暗花明又一村。', '《游山西村》· 陆游'],
    ['长风破浪会有时，直挂云帆济沧海。', '《行路难》· 李白'],
    ['路漫漫其修远兮，吾将上下而求索。', '《离骚》· 屈原'],
    ['人生如逆旅，我亦是行人。', '《临江仙·送钱穆父》· 苏轼'],
    ['海内存知己，天涯若比邻。', '《送杜少府之任蜀州》· 王勃']
  ];
  const wallImages = [
    '042006c755f71b49bb31ec8ce176e52c','054107114b2e49d7ebfcfb5f68bd48c9','070e9e75e53cfc9d18fb98e609dec7b1','0caa080e19f0635533e8ae7e0d13edcd','0d4d62ea1ff2a4f18bb10a3723a7884e','0e640d5bbc180e15bd9f951836b0f107','15dc89dd0a8ba9a37fdb2292f214ed14','1c35d3eefb0359e20264fb0dbf77f648','1de545d278e68a55bf1fb5fb34c12134','2187e5e3e1c0ce678c2c45fddf7d23ed','22e5cfb70cd084064d03e1df96f770f8','2636d3331126b9b3b4d75ddd86451f5d','269a590856ea57b454cd0a15761924c0','2910b349fdfe39d7b07c4a545a8429ef','2aa10d25bdc7dd8db25c4853b7e74fbf','34adb5ec2008e1d12c3e1c6eed31fdfd','3659b2beab016ee785990e8cf582c25b','3aabf3290793112f9244cb0b283d5032','3be94823f8218e0a28dbef0c93ad4d8f','3ca3c07d249d6f1eb63783eadf1a566f','3d8c03c1c615b022de98f3629d4561c3','41192d7a31d79bc8eefb154b16ecb645','4958e7b53e5b0242ffb750138ef3c857','4975e0d9ca8e2863476bd326d8c78545','4b9182e9b4305e772c2b045a625ded94','4d53f1a102cb1b3793d3151782f4f2f2','5ae76d67c0d30f9c6f82134493075180','5b2c0851a4a200879d15403951cff451','5deed08542e05a974d69648805e39126','642270b905a8a3685c841ca5e29448a8','6605ec09846bbef2c09ae42502e02f60','6734311a239d2147448c2bb21864ee44','6b09737c74ea5944faa403dd0ced7785','6bdfc8e5553cd898d8bbc764c392c10b','73a8a99ccda4297704206dc14f933949','796a387a2f6cf16ecbfce312e544c4ad','79dddb42ed65d4705e990f159f4cdce8','7a0ca3203ae926ea924796a3cbca2a18','7ce716aa31954d9cb9baebc6ef8545fe','7f70cf57e5d89ccff8234aea11d6ef3c','84e9d1823274da1d912ee9fd60b7cab9','95e9b557bae3d1a64844eae8805c0a8d','97afe3275fdcdaa0241d449ac86b0a32','9b57a246feeaf65aee38224793ea8596','9c829545d6eaa1da442f74aeb806f76f','9dae32da93d9d45a2c48f8f21fa8bdf2','a0418aa5991e8d3d4b75e0af7eb6d05f','a0b07efe36ea8824dd6d886d32412b59','aa815b8e6fef1e023d5299cf76666310','ad65ca59b07f08bb24b6221fb41c7a32','b2db90b0530ac0706bc102a680e4225a','ba2396d59684df12f660f590a725edb2','bb4b0bff4a65fe19fbbb09c77c48bc6f','bbb00fd90fc8ed2ab6c8b7e6e2170efa','bdc281a3146369b8b3a860a117815ee6','c32a3042cf669b9ba98997583ae0b677','c4f2e0aaa96a26994109382ff6be1cb9','c554d3836b1153490a048abdf19d974f','cb0f2e0b58f78c13e55cd209c40a647b','cdbc5258f9862248e7f5ea3ebf067e85','e9b6fba2c5bf3c4a7a43893946ef3650','eef8b884738c4ed4b49ae2661a9c9fe3','f6246b4388d79e9b45fdad925cade165','f7ee0ca024e8e5cc30244ac2d41ae14a','fd2c48ffe22b1c40eafb01a293fa65b8'
  ].map(name => `/images/photo-wall/${name}.webp`);
  const session = () => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; } };
  const headers = () => ({ apikey: KEY, Authorization: `Bearer ${session()?.access_token || KEY}` });
  const chinaDate = () => {
    const parts = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: 'numeric', day: 'numeric', weekday: 'long' }).formatToParts(new Date());
    const part = type => parts.find(item => item.type === type)?.value;
    return { year: Number(part('year')), month: Number(part('month')), day: Number(part('day')), weekday: part('weekday') };
  };
  const stampOf = date => `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  const hash = text => [...text].reduce((value, char) => ((value * 31 + char.charCodeAt(0)) >>> 0), 2166136261);
  const signedUrl = async path => {
    if (!path) return '';
    try { const response = await fetch(`${API}/storage/v1/object/sign/${BUCKET}/${encodeURI(path)}`, { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 86400 }) }); const data = response.ok ? await response.json() : {}; return data.signedURL ? `${API}/storage/v1${data.signedURL}` : ''; } catch { return ''; }
  };
  async function calendarImages() {
    try {
      const response = await fetch(`${API}/rest/v1/memory_photos?select=storage_path,created_at&location=eq.DAILY_CALENDAR_IMAGE&order=created_at.asc&limit=120`, { headers: headers() });
      if (!response.ok) return [];
      return (await response.json()).map(item => item.storage_path).filter(Boolean);
    } catch { return []; }
  }
  async function dailyChoice(stamp, paths) {
    const key = `daily-calendar-${stamp}`;
    try {
      const response = await fetch(`${API}/rest/v1/site_data?select=value&key=eq.${key}&limit=1`, { headers: headers() });
      const rows = response.ok ? await response.json() : [];
      if (rows[0]?.value) return rows[0].value;
    } catch {}
    const seed = hash(stamp); const choice = { quote: seed % quotes.length, layout: seed % 4, imagePath: paths.length ? paths[seed % paths.length] : '' };
    if (session()?.access_token) fetch(`${API}/rest/v1/site_data?on_conflict=key`, { method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ key, value: choice, updated_at: new Date().toISOString() }) }).catch(() => {});
    return choice;
  }
  const shuffle = items => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const sessionImages = shuffle([...wallImages]);

  async function calendar(copy) {
    if (copy.querySelector('.daily-poster') || copy.dataset.calendarLoading) return;
    copy.dataset.calendarLoading = 'true';
    const today = chinaDate(); const stamp = stampOf(today); const paths = await calendarImages(); const choice = await dailyChoice(stamp, paths);
    if (!copy.isConnected || copy.querySelector('.daily-poster')) { delete copy.dataset.calendarLoading; return; }
    const quote = quotes[Number(choice.quote) % quotes.length] || quotes[0];
    const fallbackImage = wallImages[hash(stamp) % wallImages.length];
    const image = choice.imagePath ? (await signedUrl(choice.imagePath) || fallbackImage) : fallbackImage;
    const card = document.createElement('article');
    card.className = `daily-poster daily-poster--layout-${Number(choice.layout) % 4}`;
    card.dataset.date = stamp;
    card.setAttribute('aria-label', `${stamp} 每日日历`);
    card.innerHTML = `<div class="daily-poster__edition"><span>DAILY CALENDAR</span><small>${today.year} · 未知之境</small></div><div class="daily-poster__date"><span>${new Intl.DateTimeFormat('en', { timeZone: 'Asia/Shanghai', month: 'long' }).format(new Date()).toUpperCase()}</span><b>${today.day}</b><small>${today.weekday}</small></div><p class="daily-poster__message">${quote[0]}</p><div class="daily-poster__art"><img src="${image}" alt="${stamp} 今日影像" loading="eager" decoding="async"></div><strong class="daily-poster__vertical">${quote[0]}</strong><small class="daily-poster__source">${quote[1]}</small><small class="daily-poster__foot">每日零点更新 · 今日唯一日签</small>`;
    copy.append(card); delete copy.dataset.calendarLoading;
  }

  function renameBrand() {
    document.title = '未知之境';
    const mark = document.querySelector('.brand > span');
    if (mark && !mark.querySelector('img')) {
      mark.textContent = '';
      const image = document.createElement('img');
      image.src = '/images/unknown-realm-emblem.webp';
      image.alt = '';
      image.width = 40;
      image.height = 40;
      mark.append(image);
    }
    document.querySelectorAll('h1,h2,h3,b,strong,span,small').forEach(node => {
      if (!node.children.length && /^(有椰之境|有椰子之境)$/.test(node.textContent.trim())) node.textContent = '未知之境';
    });
  }

  function polish() {
    renameBrand();
    const entry = document.querySelector('.entry-dialog');
    if (entry && !entry.dataset.riftPolished) {
      entry.dataset.riftPolished = 'true';
      entry.classList.add('entry-dialog--rift');
      entry.querySelector('.eyebrow')?.remove();
      const title = entry.querySelector('h2');
      if (title) title.textContent = '时空裂隙正在开启';
      entry.querySelector('h2 + p')?.remove();
      const input = entry.querySelector('input');
      if (input) {
        input.placeholder = '';
        input.setAttribute('aria-label', '身份名称');
        input.setAttribute('autocomplete', 'nickname');
        input.maxLength = 20;
      }
      const orbit = document.createElement('div');
      orbit.className = 'entry-rift-orbit';
      orbit.setAttribute('aria-hidden', 'true');
      orbit.innerHTML = '<i></i><i></i><b>✦</b>';
      entry.prepend(orbit);
    }
    if (entry) {
      const input = entry.querySelector('input');
      const error = entry.querySelector('small');
      if (input && error && !input.value.trim()) error.textContent = '请先告诉我你是谁。';
    }
    const hero = document.querySelector('.world-hero');
    if (hero) {
      const copy = hero.firstElementChild;
      const eyebrow = hero.querySelector('.eyebrow');
      const title = hero.querySelector('h2');
      if (eyebrow && !eyebrow.classList.contains('home-polish-hide')) eyebrow.classList.add('home-polish-hide');
      if (title && title.textContent !== '欢迎来到我们的世界') title.textContent = '欢迎来到我们的世界';
      if (copy) {
        const current = copy.querySelector('.daily-poster');
        if (current && current.dataset.date !== stampOf(chinaDate())) current.remove();
        calendar(copy);
      }
      const hint = hero.querySelector('.drift-wall__hint');
      if (hint && !hint.classList.contains('home-polish-hide')) hint.classList.add('home-polish-hide');
    }
    const section = document.querySelector('.world-accordion')?.closest('section');
    if (section) {
      const heading = section.querySelector('.section-title h3');
      if (heading && heading.textContent !== '选择进入的空间') heading.textContent = '选择进入的空间';
      const subtitle = section.querySelector('.section-title > p');
      if (subtitle && !subtitle.classList.contains('home-polish-hide')) subtitle.classList.add('home-polish-hide');
    }
    document.querySelectorAll('.world-panel').forEach(panel => {
      const title = panel.querySelector('.world-panel__copy strong');
      const small = panel.querySelector('.world-panel__copy small');
      if (title?.textContent === '回忆档案馆') {
        title.textContent = '回忆灯塔';
        if (small && small.textContent !== '照片故事 · 共同记忆') small.textContent = '照片故事 · 共同记忆';
        const label = panel.getAttribute('aria-label');
        if (label) panel.setAttribute('aria-label', label.replace('回忆档案馆', '回忆灯塔'));
      }
    });
    document.querySelectorAll('header nav button').forEach(button => {
      if (button.textContent?.trim() === '回忆档案馆') button.textContent = '回忆灯塔';
    });
    const wall = document.querySelector('.drift-wall');
    if (wall && !wall.dataset.randomized) {
      const imgs = [...wall.querySelectorAll('img')];
      imgs.forEach((img, i) => {
        img.src = sessionImages[i % sessionImages.length];
        img.alt = `照片墙影像 ${i + 1}`;
        img.loading = 'lazy';
        img.decoding = 'async';
      });
      wall.dataset.randomized = 'true';
    }
  }

  let scheduled = false;
  const schedulePolish = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      polish();
    });
  };
  new MutationObserver(schedulePolish).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(schedulePolish, 30000);
  polish();
})();
