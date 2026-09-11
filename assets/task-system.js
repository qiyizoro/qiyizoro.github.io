(() => {
  const API = 'https://bwspbjatblwcfjgkuqbm.supabase.co';
  const KEY = 'sb_publishable_r6wyD1OF7KQwRiJdgUwyOw_Rey-pbxM';
  const AUTH_KEY = 'sb-bwspbjatblwcfjgkuqbm-auth-token';
  const DATA_KEY = 'tasks-v2';
  const LOCAL_KEY = 'unknown-realm-tasks-v2';
  const defaults = ['一起看日落', '去一个新的城市', '一起吃一家没去过的店', '再比一次射击', '一起看海']
    .map((content, index) => ({ id: `default-${index}`, type: 'collaboration', content, due: '', reward: '', done: index === 0, createdAt: new Date(0).toISOString() }));
  let state = { version: 2, tasks: defaults };
  let activeType = 'collaboration';
  let mounted = null;
  let saving = false;

  const auth = () => {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null'); } catch { return null; }
  };
  const headers = token => ({ apikey: KEY, Authorization: `Bearer ${token || KEY}` });
  const toast = message => {
    document.querySelector('.task-toast')?.remove();
    const node = document.createElement('div');
    node.className = 'task-toast'; node.textContent = message; document.body.append(node);
    requestAnimationFrame(() => node.classList.add('show'));
    setTimeout(() => node.remove(), 3200);
  };
  const normalize = value => ({
    version: 2,
    tasks: Array.isArray(value?.tasks) ? value.tasks.map((item, index) => ({
      id: String(item.id || crypto.randomUUID()),
      type: item.type === 'world' ? 'world' : 'collaboration',
      content: String(item.content || item.title || ''),
      due: String(item.due || ''),
      reward: String(item.reward || ''),
      done: Boolean(item.done),
      createdAt: item.createdAt || new Date(Date.now() + index).toISOString()
    })) : defaults
  });

  async function loadState() {
    try { state = normalize(JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null')); } catch { state = { version: 2, tasks: defaults }; }
    const session = auth();
    if (!session?.access_token) return;
    try {
      const response = await fetch(`${API}/rest/v1/site_data?select=value&key=eq.${DATA_KEY}&limit=1`, { headers: headers(session.access_token) });
      const rows = response.ok ? await response.json() : [];
      if (rows[0]?.value) state = normalize(rows[0].value);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    } catch { toast('云端读取失败，已显示本机任务'); }
  }

  async function saveState() {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    const session = auth();
    if (!session?.access_token) { toast('已保存在本机，登录后才能跨设备同步'); return false; }
    if (saving) return false;
    saving = true;
    render();
    try {
      const response = await fetch(`${API}/rest/v1/site_data?on_conflict=key`, {
        method: 'POST',
        headers: { ...headers(session.access_token), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({ key: DATA_KEY, value: state, updated_at: new Date().toISOString() })
      });
      if (!response.ok) throw new Error();
      toast('任务已同步到云端');
      return true;
    } catch { toast('云端保存失败，内容已暂存在本机'); return false; }
    finally { saving = false; render(); }
  }

  function openComposer() {
    if (document.querySelector('.task-composer-layer')) return;
    const layer = document.createElement('div');
    layer.className = 'task-composer-layer';
    layer.innerHTML = `<form class="task-composer" aria-label="添加任务"><button type="button" class="task-composer-close" aria-label="关闭">×</button><h2>添加任务</h2><label>任务类型<select name="type"><option value="collaboration">协作任务</option><option value="world">世界任务</option></select></label><label>内容<textarea name="content" rows="3" maxlength="240" placeholder="写下要完成的事情"></textarea></label><div class="task-composer-row"><label>完成期限<input name="due" type="date"></label><label>任务奖励<input name="reward" maxlength="80" placeholder="可不填写"></label></div><p>世界任务的内容、期限和奖励不必全部填写。</p><button type="submit" class="primary">保存任务</button></form>`;
    const form = layer.querySelector('form');
    form.elements.type.value = activeType;
    const close = () => layer.remove();
    layer.querySelector('.task-composer-close').onclick = close;
    layer.onclick = event => { if (event.target === layer) close(); };
    form.onsubmit = async event => {
      event.preventDefault();
      const data = new FormData(form);
      const item = { id: crypto.randomUUID(), type: data.get('type'), content: data.get('content').trim(), due: data.get('due'), reward: data.get('reward').trim(), done: false, createdAt: new Date().toISOString() };
      if (!item.content && !item.due && !item.reward) { toast('至少填写一项任务信息'); return; }
      state.tasks.push(item); activeType = item.type; close(); render(); await saveState();
    };
    document.body.append(layer);
  }

  function render() {
    if (!mounted?.isConnected) return;
    const list = state.tasks.filter(item => item.type === activeType);
    const completed = list.filter(item => item.done).length;
    mounted.replaceChildren();
    const heading = document.createElement('div');
    heading.className = 'task-system-head';
    heading.innerHTML = `<div><p>共同进行中</p><h2>任务系统</h2></div><span>${completed} / ${list.length} 已完成</span>`;
    const tabs = document.createElement('div');
    tabs.className = 'task-tabs'; tabs.setAttribute('role', 'tablist');
    [['collaboration', '协作任务'], ['world', '世界任务']].forEach(([value, label]) => {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = label;
      button.className = value === activeType ? 'active' : '';
      button.onclick = () => { activeType = value; render(); };
      tabs.append(button);
    });
    const grid = document.createElement('div'); grid.className = 'task-grid';
    if (!list.length) {
      const empty = document.createElement('p'); empty.className = 'task-empty'; empty.textContent = '这里还没有任务'; grid.append(empty);
    }
    list.forEach(item => {
      const card = document.createElement('article'); card.className = `task-card${item.done ? ' done' : ''}`;
      const status = document.createElement('button'); status.type = 'button'; status.className = 'task-status'; status.textContent = item.done ? '✓' : '○'; status.setAttribute('aria-label', item.done ? '标记为未完成' : '标记为完成');
      const copy = document.createElement('div'); copy.className = 'task-card-copy';
      const type = document.createElement('small'); type.textContent = item.type === 'world' ? '世界任务' : '协作任务'; copy.append(type);
      if (item.content) { const title = document.createElement('h3'); title.textContent = item.content; copy.append(title); }
      const meta = document.createElement('div'); meta.className = 'task-meta';
      if (item.due) { const due = document.createElement('span'); due.textContent = `期限 ${item.due}`; meta.append(due); }
      if (item.reward) { const reward = document.createElement('span'); reward.textContent = `奖励 ${item.reward}`; meta.append(reward); }
      if (meta.childElementCount) copy.append(meta);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'task-remove'; remove.textContent = '删除'; remove.setAttribute('aria-label', '删除任务');
      status.onclick = async () => { if (saving) return; item.done = !item.done; render(); await saveState(); };
      remove.onclick = async () => { if (saving || !confirm('删除这个任务？')) return; state.tasks = state.tasks.filter(task => task.id !== item.id); render(); await saveState(); };
      card.append(status, copy, remove); grid.append(card);
    });
    const add = document.createElement('button'); add.type = 'button'; add.className = 'task-add'; add.textContent = '＋ 添加任务'; add.disabled = saving; add.onclick = openComposer;
    const sync = document.createElement('p'); sync.className = 'task-sync'; sync.textContent = auth()?.access_token ? (saving ? '正在同步…' : '已开启跨设备同步') : '登录后开启跨设备同步';
    mounted.append(heading, tabs, grid, add, sync);
  }

  async function mount() {
    const title = [...document.querySelectorAll('.subhero h1')].find(node => node.textContent.includes('接下来，一起去完成'));
    const block = title ? document.querySelector('.system-block') : null;
    if (!block || block.dataset.taskSystemV2) return;
    block.dataset.taskSystemV2 = 'true'; mounted = block;
    await loadState(); render();
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; mount(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  mount();
})();
