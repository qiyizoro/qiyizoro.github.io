import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MEMORY_BUCKET, supabase } from './supabase';
import './driftWall.css';

type WallItem = { image: string; title?: string };

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function websiteImages(): Promise<WallItem[]> {
  const images: WallItem[] = [
    { image: '/images/yeye-avatar.jpg', title: '椰椰' },
    { image: '/images/world-orbit-bg.png', title: '217号宇宙' }
  ];
  const [{ data: memories }, { data: adventures }] = await Promise.all([
    supabase.from('memory_photos').select('storage_path,description,location'),
    supabase.from('adventure_spots').select('storage_path,title,place')
  ]);
  const cloudItems = [
    ...(memories || []).map(item => ({ path: item.storage_path, title: item.description || item.location || '回忆照片' })),
    ...(adventures || []).map(item => ({ path: item.storage_path, title: item.title || item.place || '旅行照片' }))
  ].filter(item => item.path);
  const signed = await Promise.all(cloudItems.map(async item => {
    const { data } = await supabase.storage.from(MEMORY_BUCKET).createSignedUrl(item.path, 60 * 60);
    return data?.signedUrl ? { image: data.signedUrl, title: item.title } : null;
  }));
  signed.forEach(item => { if (item) images.push(item); });
  return shuffle(images);
}

export default function DriftWall() {
  const rootRef = useRef<HTMLDivElement>(null);
  const planeRef = useRef<HTMLDivElement>(null);
  const tracksRef = useRef<(HTMLDivElement | null)[]>([]);
  const offsets = useRef<number[]>([]);
  const pointer = useRef({ x: 0, y: 0 });
  const damped = useRef({ x: 0, y: 0 });
  const [items, setItems] = useState<WallItem[]>(() => shuffle([
    { image: '/images/yeye-avatar.jpg', title: '椰椰' },
    { image: '/images/world-orbit-bg.png', title: '217号宇宙' }
  ]));
  const [active, setActive] = useState('');
  const columns = 4;

  useEffect(() => {
    let active = true;
    websiteImages().then(next => { if (active) setItems(next); });
    return () => { active = false; };
  }, []);

  const wallItems = useMemo(() => {
    if (!items.length) return [];
    return Array.from({ length: Math.max(16, items.length * 4) }, (_, i) => items[i % items.length]);
  }, [items]);

  const columnItems = useMemo(() => {
    const result = Array.from({ length: columns }, () => [] as WallItem[]);
    wallItems.forEach((item, index) => result[index % columns].push(item));
    return result;
  }, [wallItems]);

  const updatePointer = useCallback((clientX: number, clientY: number) => {
    const rect = rootRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointer.current = {
      x: (clientX - rect.left) / rect.width - 0.5,
      y: (clientY - rect.top) / rect.height - 0.5
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    let last = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      damped.current.x += (pointer.current.x - damped.current.x) * 0.07;
      damped.current.y += (pointer.current.y - damped.current.y) * 0.07;
      if (planeRef.current) {
        planeRef.current.style.transform = `translate(-50%,-50%) scale(1.2) rotateX(${12 - damped.current.y * 8}deg) rotateY(${-12 + damped.current.x * 8}deg) translateZ(-90px)`;
      }
      tracksRef.current.forEach((track, index) => {
        if (!track) return;
        const height = track.scrollHeight / 2 || 1;
        const direction = index % 2 ? -1 : 1;
        offsets.current[index] = ((offsets.current[index] || 0) + direction * (18 + index * 3) * dt + height) % height;
        track.style.transform = `translate3d(0, ${-offsets.current[index]}px, 0)`;
      });
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className="drift-wall"
      ref={rootRef}
      aria-label="我们的照片墙"
      onPointerMove={event => updatePointer(event.clientX, event.clientY)}
      onPointerDown={event => updatePointer(event.clientX, event.clientY)}
      onPointerLeave={() => { pointer.current = { x: 0, y: 0 }; setActive(''); }}
    >
      <div className="drift-wall__plane" ref={planeRef}>
        {columnItems.map((column, columnIndex) => {
          const repeated = [...column, ...column, ...column];
          return <div className="drift-wall__column" key={columnIndex}>
            <div className="drift-wall__track" ref={node => { tracksRef.current[columnIndex] = node; }}>
              {repeated.map((item, itemIndex) => {
                const id = `${columnIndex}-${itemIndex}`;
                return <button
                  type="button"
                  className={`drift-wall__tile ${active === id ? 'is-active' : ''}`}
                  key={id}
                  onPointerEnter={() => setActive(id)}
                  onFocus={() => setActive(id)}
                  onBlur={() => setActive('')}
                  aria-label={item.title || '网站照片'}
                ><img src={item.image} alt={item.title || ''} draggable={false}/></button>;
              })}
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}
