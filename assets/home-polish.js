(() => {
  const messages = ['宜把温柔留给彼此', '宜认真收藏今天', '宜分享一件微小的快乐', '宜允许自己慢慢生长', '宜期待下一次共同抵达', '宜在疲惫时好好停靠', '宜勇敢表达真实感受', '宜去探索新的支线', '宜相信长久的陪伴', '宜为平凡日子留一束光'];
  const wallImages = [
    '042006c755f71b49bb31ec8ce176e52c','054107114b2e49d7ebfcfb5f68bd48c9','070e9e75e53cfc9d18fb98e609dec7b1','0caa080e19f0635533e8ae7e0d13edcd','0d4d62ea1ff2a4f18bb10a3723a7884e','0e640d5bbc180e15bd9f951836b0f107','15dc89dd0a8ba9a37fdb2292f214ed14','1c35d3eefb0359e20264fb0dbf77f648','1de545d278e68a55bf1fb5fb34c12134','2187e5e3e1c0ce678c2c45fddf7d23ed','22e5cfb70cd084064d03e1df96f770f8','2636d3331126b9b3b4d75ddd86451f5d','269a590856ea57b454cd0a15761924c0','2910b349fdfe39d7b07c4a545a8429ef','2aa10d25bdc7dd8db25c4853b7e74fbf','34adb5ec2008e1d12c3e1c6eed31fdfd','3659b2beab016ee785990e8cf582c25b','3aabf3290793112f9244cb0b283d5032','3be94823f8218e0a28dbef0c93ad4d8f','3ca3c07d249d6f1eb63783eadf1a566f','3d8c03c1c615b022de98f3629d4561c3','41192d7a31d79bc8eefb154b16ecb645','4958e7b53e5b0242ffb750138ef3c857','4975e0d9ca8e2863476bd326d8c78545','4b9182e9b4305e772c2b045a625ded94','4d53f1a102cb1b3793d3151782f4f2f2','5ae76d67c0d30f9c6f82134493075180','5b2c0851a4a200879d15403951cff451','5deed08542e05a974d69648805e39126','642270b905a8a3685c841ca5e29448a8','6605ec09846bbef2c09ae42502e02f60','6734311a239d2147448c2bb21864ee44','6b09737c74ea5944faa403dd0ced7785','6bdfc8e5553cd898d8bbc764c392c10b','73a8a99ccda4297704206dc14f933949','796a387a2f6cf16ecbfce312e544c4ad','79dddb42ed65d4705e990f159f4cdce8','7a0ca3203ae926ea924796a3cbca2a18','7ce716aa31954d9cb9baebc6ef8545fe','7f70cf57e5d89ccff8234aea11d6ef3c','84e9d1823274da1d912ee9fd60b7cab9','95e9b557bae3d1a64844eae8805c0a8d','97afe3275fdcdaa0241d449ac86b0a32','9b57a246feeaf65aee38224793ea8596','9c829545d6eaa1da442f74aeb806f76f','9dae32da93d9d45a2c48f8f21fa8bdf2','a0418aa5991e8d3d4b75e0af7eb6d05f','a0b07efe36ea8824dd6d886d32412b59','aa815b8e6fef1e023d5299cf76666310','ad65ca59b07f08bb24b6221fb41c7a32','b2db90b0530ac0706bc102a680e4225a','ba2396d59684df12f660f590a725edb2','bb4b0bff4a65fe19fbbb09c77c48bc6f','bbb00fd90fc8ed2ab6c8b7e6e2170efa','bdc281a3146369b8b3a860a117815ee6','c32a3042cf669b9ba98997583ae0b677','c4f2e0aaa96a26994109382ff6be1cb9','c554d3836b1153490a048abdf19d974f','cb0f2e0b58f78c13e55cd209c40a647b','cdbc5258f9862248e7f5ea3ebf067e85','e9b6fba2c5bf3c4a7a43893946ef3650','eef8b884738c4ed4b49ae2661a9c9fe3','f6246b4388d79e9b45fdad925cade165','f7ee0ca024e8e5cc30244ac2d41ae14a','fd2c48ffe22b1c40eafb01a293fa65b8'
  ].map(name => `/images/photo-wall/${name}.webp`);
  const shuffle = items => {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const sessionImages = shuffle([...wallImages]);

  function updatePoster(card, message) {
    card.querySelector('.daily-poster__message').textContent = message;
    card.querySelector('.daily-poster__vertical').textContent = message;
  }

  function calendar(copy) {
    if (copy.querySelector('.daily-poster')) return;
    const today = new Date();
    const stamp = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
    let index;
    try {
      const saved = JSON.parse(localStorage.getItem('unknown-daily-poster') || 'null');
      index = saved?.date === stamp ? saved.index : Math.floor(Math.random() * messages.length);
      localStorage.setItem('unknown-daily-poster', JSON.stringify({ date: stamp, index }));
    } catch {
      index = Math.floor(Math.random() * messages.length);
    }
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'daily-poster';
    card.setAttribute('aria-label', '换一张每日签');
    card.innerHTML = `<div class="daily-poster__edition"><span>DAILY CALENDAR</span><small>${today.getFullYear()} · 未知之境</small></div><div class="daily-poster__date"><span>${today.toLocaleString('en', { month: 'long' }).toUpperCase()}</span><b>${today.getDate()}</b><small>${today.toLocaleDateString('zh-CN', { weekday: 'long' })}</small></div><p class="daily-poster__message">${messages[index]}</p><div class="daily-poster__art"><img src="${sessionImages[0]}" alt="今日影像" loading="lazy" decoding="async"></div><strong class="daily-poster__vertical">${messages[index]}</strong><small class="daily-poster__foot">轻触更换 · 每日一签</small>`;
    card.onclick = () => {
      index = (index + 1 + Math.floor(Math.random() * (messages.length - 1))) % messages.length;
      try { localStorage.setItem('unknown-daily-poster', JSON.stringify({ date: stamp, index })); } catch {}
      updatePoster(card, messages[index]);
    };
    copy.append(card);
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
    const hero = document.querySelector('.world-hero');
    if (hero) {
      const copy = hero.firstElementChild;
      const eyebrow = hero.querySelector('.eyebrow');
      const title = hero.querySelector('h2');
      if (eyebrow && !eyebrow.classList.contains('home-polish-hide')) eyebrow.classList.add('home-polish-hide');
      if (title && title.textContent !== '欢迎来到我们的世界') title.textContent = '欢迎来到我们的世界';
      if (copy) calendar(copy);
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
  polish();
})();
