import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { gsap } from 'gsap';
import { Cloud, Image as ImageIcon, LoaderCircle, LockKeyhole, LogIn, LogOut, MapPin, Plus, Trash2, X } from 'lucide-react';
import { MEMORY_BUCKET, supabase } from './supabase';
import './memoryMasonry.css';

type MemoryPhoto = { id: string; image: string; storagePath: string; description: string; location: string; ratio: number };
type Draft = { file: File | null; image: string; description: string; location: string; ratio: number };
const blankDraft: Draft = { file: null, image: '', description: '', location: '', ratio: 1.2 };
const ALLOWED_EMAIL = 'qiyideguge@gmail.com';

export default function MemoryMasonry() {
  const [session, setSession] = useState<Session | null>(null);
  const [items, setItems] = useState<MemoryPhoto[]>([]);
  const [email, setEmail] = useState(ALLOWED_EMAIL);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(true);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [deleteTarget, setDeleteTarget] = useState<MemoryPhoto | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(false);
  const wall = useRef<HTMLDivElement>(null);
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setBusy(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => { setSession(next); setBusy(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setItems([]); return; }
    let active = true;
    setBusy(true);
    supabase.from('memory_photos').select('*').order('created_at', { ascending: true }).then(async ({ data, error }) => {
      if (!active) return;
      if (error) { setNotice('云端空间尚未完成初始化。'); setBusy(false); return; }
      const hydrated = await Promise.all((data || []).map(async row => {
        const { data: signed } = await supabase.storage.from(MEMORY_BUCKET).createSignedUrl(row.storage_path, 86400);
        return { id: row.id, image: signed?.signedUrl || '', storagePath: row.storage_path, description: row.description, location: row.location, ratio: row.ratio };
      }));
      if (active) { setItems(hydrated); setBusy(false); }
    });
    return () => { active = false; };
  }, [session]);

  useEffect(() => {
    if (!wall.current || !items.length) return;
    gsap.fromTo(wall.current.querySelectorAll('.memory-tile'), { opacity: 0, y: 70, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: .72, stagger: .07, ease: 'power3.out' });
  }, [items.length]);

  const sendLoginLink = async () => {
    setNotice(''); setBusy(true);
    const normalized = email.trim().toLowerCase();
    if (normalized !== ALLOWED_EMAIL) { setNotice('这个邮箱暂未加入访问名单。'); setBusy(false); return; }
    const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: { emailRedirectTo: 'https://qiyizoro.github.io/' } });
    setNotice(error ? `发送失败：${error.message}` : '登录链接已经发送到邮箱，请在同一台设备上点开。');
    setBusy(false);
  };

  const chooseImage = (file?: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { setNotice('照片不能超过 15MB。'); return; }
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setDraft(value => ({ ...value, file, image: imageUrl, ratio: Math.max(.75, Math.min(1.65, image.height / image.width)) }));
    image.src = imageUrl;
  };

  const save = async () => {
    if (!session || !draft.file || !draft.description.trim() || !draft.location.trim()) return;
    setBusy(true); setNotice('正在保存到云端…');
    const extension = draft.file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const storagePath = `${session.user.id}/${crypto.randomUUID()}.${extension}`;
    const uploaded = await supabase.storage.from(MEMORY_BUCKET).upload(storagePath, draft.file, { contentType: draft.file.type, upsert: false });
    if (uploaded.error) { setNotice(`照片保存失败：${uploaded.error.message}`); setBusy(false); return; }
    const inserted = await supabase.from('memory_photos').insert({ storage_path: storagePath, description: draft.description.trim(), location: draft.location.trim(), ratio: draft.ratio }).select().single();
    if (inserted.error) { await supabase.storage.from(MEMORY_BUCKET).remove([storagePath]); setNotice(`说明保存失败：${inserted.error.message}`); setBusy(false); return; }
    const { data: signed } = await supabase.storage.from(MEMORY_BUCKET).createSignedUrl(storagePath, 86400);
    setItems(value => [...value, { id: inserted.data.id, image: signed?.signedUrl || draft.image, storagePath, description: inserted.data.description, location: inserted.data.location, ratio: inserted.data.ratio }]);
    setDraft(blankDraft); setAdding(false); setNotice('已保存到云端，手机和电脑都会看到。'); setBusy(false);
  };

  const askDelete = (item: MemoryPhoto) => { setDeleteTarget(item); setDeletePassword(''); setDeleteError(false); };
  const cancelHold = () => { if (holdTimer.current !== null) window.clearTimeout(holdTimer.current); holdTimer.current = null; };
  const startHold = (item: MemoryPhoto) => { cancelHold(); holdTimer.current = window.setTimeout(() => { askDelete(item); navigator.vibrate?.(35); }, 650); };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deletePassword !== '5555') { setDeleteError(true); return; }
    setBusy(true);
    const target = deleteTarget;
    const { error } = await supabase.from('memory_photos').delete().eq('id', target.id);
    if (!error) await supabase.storage.from(MEMORY_BUCKET).remove([target.storagePath]);
    if (error) setNotice(`删除失败：${error.message}`); else { setItems(value => value.filter(item => item.id !== target.id)); setNotice('照片已从云端删除。'); }
    setDeleteTarget(null); setDeletePassword(''); setDeleteError(false); setBusy(false);
  };

  if (busy && !session) return <section className="memory-cloud-card"><LoaderCircle className="memory-spin"/><p>正在连接私人云端空间…</p></section>;
  if (!session) return <section className="memory-cloud-card"><Cloud/><p className="eyebrow">私人云端档案</p><h2>请在世界入口登录</h2><p>登录入口已经统一移动到启动页右上角，登录后所有设备会读取同一份云端内容。</p></section>;

  return <section className="memory-masonry-section">
    <div className="memory-cloud-status"><span><Cloud size={15}/>云端同步已开启 · {sessionStorage.getItem('world-player') || '访客'}</span></div>
    {notice && <p className="memory-notice">{notice}</p>}
    {busy && <div className="memory-busy"><LoaderCircle className="memory-spin"/>正在同步…</div>}
    {items.length ? <div className="memory-masonry" ref={wall}>{items.map(item => <article className="memory-tile" key={item.id} style={{ aspectRatio: `1 / ${item.ratio}` }} onTouchStart={() => startHold(item)} onTouchEnd={cancelHold} onTouchMove={cancelHold} onTouchCancel={cancelHold}><img src={item.image} alt={item.description}/><button className="memory-delete" onClick={() => askDelete(item)} aria-label={`删除：${item.description}`}><Trash2 size={15}/><span>删除</span></button><div className="memory-tile__copy"><p>{item.description}</p><span><MapPin size={13}/>{item.location}</span></div></article>)}</div> : <div className="memory-masonry-empty"><ImageIcon size={28}/><h3>云端记忆墙还没有照片</h3><p>上传第一段回忆后，它会同步显示在登录过的手机和电脑上。</p></div>}
    <button className="memory-add" onClick={() => setAdding(true)}><Plus size={18}/>自主添加图片与文字说明</button>
    {adding && <div className="memory-editor-backdrop" onMouseDown={() => setAdding(false)}><section className="memory-editor" onMouseDown={event => event.stopPropagation()}><button className="memory-editor-close" onClick={() => setAdding(false)} aria-label="关闭"><X/></button><p className="eyebrow">添加新的云端记忆</p><h2>保存一张照片</h2><label className="memory-image-picker">{draft.image ? <img src={draft.image} alt="预览"/> : <><ImageIcon/><span>选择照片</span></>}<input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={event => chooseImage(event.target.files?.[0])}/></label><label>说明<textarea rows={3} value={draft.description} onChange={event => setDraft({ ...draft, description: event.target.value })} placeholder="写下照片里的故事或当时的感受…"/></label><label>地点<input value={draft.location} onChange={event => setDraft({ ...draft, location: event.target.value })} placeholder="例如：长沙 · 橘子洲"/></label><button className="primary memory-save" onClick={save} disabled={busy || !draft.file || !draft.description.trim() || !draft.location.trim()}>保存到云端</button></section></div>}
    {deleteTarget && <div className="memory-editor-backdrop" onMouseDown={() => setDeleteTarget(null)}><section className="delete-dialog" onMouseDown={event => event.stopPropagation()}><button className="memory-editor-close" onClick={() => setDeleteTarget(null)} aria-label="关闭"><X/></button><LockKeyhole/><p className="eyebrow">受保护操作</p><h2>从云端删除这张照片？</h2><p>请输入删除密码。验证成功后，所有设备都将无法再看到这张照片。</p><input autoFocus type="password" inputMode="numeric" maxLength={4} value={deletePassword} onChange={event => { setDeletePassword(event.target.value); setDeleteError(false); }} placeholder="四位密码" onKeyDown={event => { if (event.key === 'Enter') confirmDelete(); }}/>{deleteError && <small>密码不正确，请重新输入。</small>}<button className="delete-confirm" onClick={confirmDelete}><Trash2 size={16}/>确认删除</button></section></div>}
  </section>;
}
